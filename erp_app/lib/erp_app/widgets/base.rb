
# == Basic overview
# Based on ideas and code snippits from Cell plugin this library allows you
# to imbed a reusable component into view that is decoupled from the controller
# and view it resides in. It can have its own MVC lifecycle independent of its parent
# view.

require 'abstract_controller'
require 'action_controller'

module ErpApp
  module Widgets
    class Base < ActionController::Metal
      include AbstractController
      include Rendering, Layouts, Helpers, Callbacks, Translation
      include ActionController::RequestForgeryProtection
	  
      IGNORED_PARAMS = %w{action controller uuid widget_name widget_action dynamic_form_id dynamic_form_model_id model_name use_dynamic_form authenticity_token is_html_form commit utf8}
    
      delegate :config, :params, :session, :request, :logger, :user_signed_in?, :current_user, :flash, :update_div_id, :update_html, :current_theme_paths, :request, :to => :controller

      attr_accessor :controller
      attr_reader   :state_name
      attr_accessor :name
      attr_accessor :div_id
      attr_accessor :html
      attr_accessor :view
      attr_accessor :uuid
      attr_accessor :widget_params
      cattr_accessor :view_resolver_cache
	  
      def log(*args); end
	  
      def process(*)  # defined in AC::Metal.
        self.response_body = super
      end

      def initialize(controller, name, view, uuid, widget_params)
        self.name = name
        self.controller = controller
        self.view = view
        self.uuid = uuid
        self.widget_params = widget_params
        store_widget_params
        merge_params
      end

      def render(opts={})
        ErpApp::Widgets::Base.view_resolver_cache = [] if ErpApp::Widgets::Base.view_resolver_cache.nil?
        add_view_paths
        render_view_for(opts, self.view)
      end
    
      def render_view_for(opts, state)
        return '' if opts[:nothing]
      
        if opts[:update]
          update_opts = opts[:update]
          if opts[:text]
            js = update_opts[:text]
          else
            opts = defaultize_render_options_for(update_opts, state)
            template = find_family_view_for_state(opts[:view])
            opts[:template] = template
            js = render_to_string(opts)
          end
          return {:json => {:htmlId => update_opts[:id], :html => js}}
        elsif opts[:text]   ### FIXME: generic option?
        elsif opts[:inline]
        elsif opts[:file]
        elsif opts[:json]
          opts[:json] = opts[:json].to_json
        elsif opts[:state]  ### FIXME: generic option
          opts[:text] = render_state(opts[:state])
        else
          # handle :layout, :template_format, :view
          opts = defaultize_render_options_for(opts, state)
          template = find_family_view_for_state(opts[:view])
          opts[:template] = template
          opts[:inline] = render_to_string(opts)
          opts.except!(:template)
        end
        sanitize_render_options(opts)
      end
    
      def find_family_view_for_state(state)
        missing_template_exception = nil

        begin
          template = find_template(state)
          return template if template
        rescue ::ActionView::MissingTemplate => missing_template_exception
        end
      
        raise missing_template_exception
      end
    
      def defaultize_render_options_for(opts, state)
        opts[:view] ||= state
        opts
      end
    
      def sanitize_render_options(opts)
        opts.except!(:view)
      end
    
      protected
      #get location of this class that is being executed
      def locate
        File.dirname(__FILE__)
      end

      private
      def merge_params
        stored_widget_params = session[:widgets][self.uuid]
        unless stored_widget_params.nil?
          self.params.merge!(stored_widget_params)
        end
      end

      def store_widget_params
        session[:widgets] = {} if session[:widgets].nil?
        session[:widgets][self.uuid] = self.widget_params if (!self.widget_params.nil? and !self.widget_params.empty?)
      end

      def add_view_paths
        #set default view paths
        cached_resolver = ErpApp::Widgets::Base.view_resolver_cache.find{|resolver| resolver.to_path == File.join(locate,"/views")}
        if cached_resolver.nil?
          resolver = ActionView::OptimizedFileSystemResolver.new(File.join(locate,"/views"))
          prepend_view_path(resolver)
          ErpApp::Widgets::Base.view_resolver_cache << resolver
        else
          prepend_view_path(cached_resolver)
        end
      end
    
      class << self
        def views_location
          File.join(File.dirname(__FILE__),"/views")
        end

        def widget_name
          File.basename(File.dirname(__FILE__))
        end
      
        def installed_widgets
          locate_widgets
        end
      
        private
      
        def locate_widgets
          widgets = []
          #get all widgets in root
          widget_path = File.join(Rails.root.to_s,"/app/widgets/")
          widgets = widgets | Dir.entries(widget_path) if File.exists? widget_path
        
          #get all widgets in engines
          Rails::Application::Railties.engines.each do |engine|
            #exclude widgets path in erp_app it defines are widgets
            next if engine.engine_name == "erp_app"
            widget_path = File.join(engine.root.to_s,"/app/widgets/")
            widgets = widgets | Dir.entries(widget_path) if File.exists? widget_path
          end
          #remove .svn .git etc files
          widgets.delete_if{|name| name =~ /^\./}
          widgets
        end
      end

    end
  end
end