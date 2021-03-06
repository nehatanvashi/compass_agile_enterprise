require 'erp_tech_svcs/utils/compass_pdf'

# Middleware that will convert html to pdf.
# This will intercept a HTTP Request and look for the .pdf on the end of the URI
# if found then we'll convert any request for html to pdf. 

# NOTE: The executable, wkhtmltopdf, that does the conversion must be installed 
# and available.
# wkhtmltopdf is available at http://code.google.com/p/wkhtmltopdf/

# NOTE: To enable this add, or uncomment, this in the environment.rb
#   config.middleware.use "PDFProcessor"

# TODO: 
# Better Loggging with the Rails logger
# Restrict based on URL, may want to use Rack::Builder
# Extract pdf processor to technical service.
# May want to look into async procssing
class PDFProcessor

  def initialize(app, enable_logging = false)
    @app = app
    @log_enabled = enable_logging
  end

  def call(env)
    @req = Rack::Request.new(env)

    pre_process(env)

    # call the next middleware/app. Currently only rails
    @status, @headers, @response = @app.call(env)

    log "HTTP Response @status = #{@status.inspect}"
    log "HTTP Response @headers = #{@headers.inspect}" 

    post_process(env)
    log "returning from #{self.class.name}" 
    [@status, @headers, @response]

  end

  def pre_process(env)
    # break the URI, ex: /hicv/home.pdf
    # path = /hicv/home
    # format = pdf
    @path, @format = @req.path_info.split('.')
    @req.path_info = @path

    log "format = #{@format}" 
    log "@request.path_info = #{@req.path_info}" 

    # rewrite the URI, so rails doesn't see the pdf format/extension
    # Otherwise, it'll attempt to handle pdf MIME content in the respond_to block
    if !!@format && @format == 'pdf'      
      env["REQUEST_PATH"] = @path
      env["REQUEST_URI"] = @path
    end
    log " REQUEST_PATH = #{env["REQUEST_PATH"]}" 
    log " REQUEST_URI = #{env["REQUEST_URI"]}" 
    
  end

  def post_process(env)
    # process the html into pdf iff:
    # - Good HTTP status 
    # TODO: should check other HTTP status, redirect,...
    # AND
    # - Response Content-Type is html
    # AND
    # - Incoming URI has an '.pdf' extension OR format=pdf param

    # TODO: Checked of for Accept application/pdf in HTTP Request
    if @status == 200 && @headers["Content-Type"].include?("text/html") && @format == 'pdf'      
      orig_body = @response.body

      # add full path to images, needed for pdf generation
      img_tag = "img src=\"file://"+ "#{RAILS_ROOT}" + "/public/"
      log "img_tag = #{img_tag}" 
      body = orig_body.gsub(/img src=\"/,img_tag)

      # invoke prince with the right options
      pdf_xlate = CompassPDF::PDF_XLATOR
      # save the response generated by rails
      pdf_xlate.write_html_response(body)

      # generate the pdf
      log "pdf_command = #{pdf_xlate.command.inspect}"
      pdf_xlate.invoke

      pdf_out = pdf_xlate.get_pdf_generated
      #log "pdf_out = #{pdf_out.inspect}"

      # return the pdf
      @response.body = pdf_out
      @headers = { "Content-Type" => "application/pdf"}
      
    end
  end
  private

  def log(message)
    puts "PDFProcessor:: #{message}" if @log_enabled
  end

end
