require 'action_view'

module ErpApp
	module ApplicationResourceLoader
		class FileSystemLoader < ErpApp::ApplicationResourceLoader::BaseLoader
		  @javascripts_folder = nil
		  @stylesheets_folder = nil

		  def initialize(application)
        @application = application
		  end

		  def locate_resources(resource_type)
        @app_name = @application.internal_identifier
        @app_type = (@application.type == 'DesktopApplication') ? 'desktop' : 'organizer'

        locate_resource_files(resource_type)
		  end

		  private

		  def locate_resource_files(resource_type)
  		  engine_dirs = Rails::Application::Railties.engines.map{|p| p.config.root.to_s}
        root_and_engines_dirs = ([Rails.root] | engine_dirs)

        application_files = []
  			root_and_engines_dirs.each do |engine_dir|
  			  #get all files based on resource type we are loading for the given application type and application
  			  if File.exists? File.join(engine_dir,"public/#{resource_type}/erp_app/#{@app_type}/applications",@app_name)
  			    application_path = File.join(engine_dir,"public/#{resource_type}/erp_app/#{@app_type}/applications",@app_name,"*.#{(resource_type == 'javascripts') ? 'js' : 'css'}")
  			    application_files = application_files | Dir.glob(application_path)
  			  end
  			end
  			application_files = sort_files(application_files.collect{|file| File.basename(file)})

  			#make sure the base js file is loaded before all others
  			if resource_type == 'javascripts' && (application_files.index{|x| x =~ /module.js/} || application_files.index{|x| x =~ /base.js/})
  			  index = (@app_type == 'desktop') ? application_files.index{|x| x =~ /module.js/} : application_files.index{|x| x =~ /base.js/}
  			  first_load_js = application_files[index]
  			  application_files.delete_at(index)
  			  application_files.push(first_load_js)
  			  application_files.reverse!
  			end
        application_files.map!{|file| "erp_app/#{@app_type}/applications/#{@app_name}/#{file}"}

        #get any extensions from other engines
        engine_extension_files = []
  			engine_dirs.each do |engine_dir|
  			  #get all files based on resource type we are loading for the given application type and application
  			  if File.exists? File.join(engine_dir,"public/#{resource_type}/extensions/compass_ae/erp_app/#{@app_type}/applications",@app_name)
  			    application_path = File.join(engine_dir,"public/#{resource_type}/extensions/compass_ae/erp_app/#{@app_type}/applications",@app_name,"*.#{(resource_type == 'javascripts') ? 'js' : 'css'}")
  			    engine_extension_files = engine_extension_files | Dir.glob(application_path)
  			  end
  			end
  			engine_extension_files = sort_files(engine_extension_files.collect{|file| File.basename(file)})
        engine_extension_files.map!{|file| "extensions/compass_ae/erp_app/#{@app_type}/applications/#{@app_name}/#{file}"}

        #get any extension from root rails app
        root_extension_files = []
        if File.exists? File.join(Rails.root,"public/#{resource_type}/extensions/compass_ae/erp_app", @app_type, 'applications', @app_name)
          application_path = File.join(Rails.root,"public/#{resource_type}/extensions/compass_ae/erp_app", @app_type, 'applications', @app_name,"*.#{(resource_type == 'javascripts') ? 'js' : 'css'}")
          root_extension_files = root_extension_files | Dir.glob(application_path)
        end
        root_extension_files = sort_files(root_extension_files.collect{|file| File.basename(file)})
        root_extension_files.map!{|file| "extensions/compass_ae/erp_app/#{@app_type}/applications/#{@app_name}/#{file}"}

		    (application_files + engine_extension_files + root_extension_files)
		  end

		end#FileSystemLoader
	end#ApplicationResourceLoader
end#ErpApp
