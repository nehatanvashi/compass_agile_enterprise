Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.CenterRegion",{
  extend:"Ext.panel.Panel",
  alias:'widget.knitkit_centerregion',
  ckEditorToolbar:[
  ['Source','-','CompassSave','Preview','Print'],
  ['Cut','Copy','Paste','PasteText','PasteFromWord'],
  ['Undo','Redo'],
  ['Find','Replace'],
  ['SpellChecker','-','SelectAll'],
  ['TextColor','BGColor'],
  ['Bold','Italic','Underline','Strike'],
  ['Subscript','Superscript','-','jwplayer'],
  ['Table','NumberedList','BulletedList'],
  ['Outdent','Indent','Blockquote'],
  ['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],
  ['BidiLtr','BidiRtl'],
  ['Link','Unlink','Anchor'],
  ['HorizontalRule','SpecialChar','PageBreak'],
  ['ShowBlocks','RemoveFormat'],
  ['Styles','Format','Font','FontSize' ],
  ['Maximize','-','About']
  ],

  setWindowStatus : function(status){
    this.findParentByType('statuswindow').setStatus(status);
  },
    
  clearWindowStatus : function(){
    this.findParentByType('statuswindow').clearStatus();
  },

  viewSectionLayout : function(title, template){
    this.workArea.add({
      title:title + ' - Layout',
      disableToolbar:true,
      xtype:'codemirror',
      parser:'rhtml',
      sourceCode:template,
      closable:true
    });
    this.workArea.setActiveTab(this.workArea.items.length - 1);
    return false;
  },

  saveSectionLayout : function(sectionId, content){
    var self = this;
    this.setWindowStatus('Saving...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/section/save_layout',
      method: 'POST',
      params:{
        id:sectionId,
        content:content
      },
      success: function(response) {
        self.clearWindowStatus();
        var obj =  Ext.decode(response.responseText);
        if(obj.success){
          var activeTab = self.workArea.getActiveTab();
          activeTab.query('knitkit_versionswebsitesectiongridpanel')[0].store.load();
        }
        else{
          Ext.Msg.alert('Error', obj.message);
        }
      },
      failure: function(response) {
        self.clearWindowStatus();
        Ext.Msg.alert('Error', 'Error saving layout');
      }
    });
  },

  editSectionLayout : function(sectionName, websiteId, websiteSectionId, content, tbarItems){
    var self = this;
    var itemId = 'section-'+websiteSectionId;
    var item = this.workArea.query('#'+itemId).first();

    if(Compass.ErpApp.Utility.isBlank(item)){
      item = Ext.create("Ext.panel.Panel",{
        layout:'border',
        title:sectionName,
        closable:true,
        itemId:itemId,
        items:[
        {
          title:sectionName + ' - Layout',
          tbarItems:tbarItems,
          xtype:'codemirror',
          parser:'erb',
          region:'center',
          sourceCode:content,
          closable:true,
          listeners:{
            'save':function(codeMirror, content){
              self.saveSectionLayout(websiteSectionId, content);
            }
          }
        },
        {
          xtype:'knitkit_versionswebsitesectiongridpanel',
          websiteSectionId:websiteSectionId,
          region:'south',
          height:150,
          collapsible:true,
          centerRegion:self,
          siteId:websiteId
        }
        ],
        listeners:{
          'show':function(panel){
            Ext.getCmp('knitkitWestRegion').selectWebsite(websiteId);
          }
        }
      });

      this.workArea.add(item);
    }

    this.workArea.setActiveTab(item);
    return false;
  },

  saveTemplateFile : function(path, content){
    var self = this;
    this.setWindowStatus('Saving...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/theme/update_file',
      method: 'POST',
      params:{
        node:path,
        content:content
      },
      success: function(response) {
        var obj = Ext.decode(response.responseText);
        self.clearWindowStatus();
        if(!obj.success){
          Ext.Msg.alert('Error', obj.message);
        }
      },
      failure: function(response) {
        self.clearWindowStatus();
        Ext.Msg.alert('Error', 'Error saving contents');
      }
    });
  },

  editTemplateFile : function(node, content, tbarItems, themeId){
    var self = this;
    var fileName = node.data.id.split('/').pop().split('.')[0];
    var fileType = node.data.id.split('.').pop();
    var itemId = fileName+themeId;
    var item = this.workArea.query('#'+itemId).first();

    if(Compass.ErpApp.Utility.isBlank(item)){
      item = Ext.create('Ext.panel.Panel',{
        closable:true,
        title:fileName,
        itemId:itemId,
        layout:'fit',
        items:[{
          tbarItems:tbarItems,
          xtype:'codemirror',
          parser:fileType,
          sourceCode:content,
          closable:true,
          listeners:{
            'save':function(codeMirror, content){
              self.saveTemplateFile(node.data.id, content);
            }
          }
        }]
      });

      this.workArea.add(item);
    }

    this.workArea.setActiveTab(item);
    return false;
  },

  saveExcerpt : function(id, content){
    var self = this;
    this.setWindowStatus('Saving...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/content/save_excerpt',
      method: 'POST',
      params:{
        id:id,
        html:content
      },
      success: function(response) {
        var obj =  Ext.decode(response.responseText);
        if(obj.success){
          self.clearWindowStatus();
          var activeTab = self.workArea.getActiveTab();
          var panel = activeTab.query('knitkit_versionsbloggridpanel');
          if(panel.length == 0){
            panel = activeTab.query('knitkit_nonpublishedversionswebsitesectiongridpanel');
          }
          panel[0].getStore().load();
        }
        else{
          Ext.Msg.alert('Error', 'Error saving excerpt');
          self.clearWindowStatus();
        }
      },
      failure: function(response) {
        self.clearWindowStatus();
        Ext.Msg.alert('Error', 'Error saving excerpt');
      }
    });
  },

  editExcerpt : function(title, id, content, siteId, contentGridStore){
    var self = this;
    var itemId = 'editExcerpt-'+id;
    var item = this.workArea.query('#'+itemId).first();

    if(Compass.ErpApp.Utility.isBlank(item)){
      var ckEditor = Ext.create("Compass.ErpApp.Shared.CKeditor",{
        autoHeight:true,
        value:content,
        ckEditorConfig:{
          extraPlugins:'compasssave,jwplayer', // removed codemirror plugin as it is unstable
          toolbar:self.ckEditorToolbar
        },
        listeners:{
          'save':function(ckEditor, content){
            self.saveExcerpt(id, content);
            contentGridStore.load();
          }
        }
      });

      var items = [ {
        xtype:'panel',
        layout:'fit',
        split:true,
        region:'center',
        items:ckEditor,
        autoDestroy:true
      }];

      if(!Compass.ErpApp.Utility.isBlank(siteId)){
        items.push( {
          xtype:'knitkit_versionsbloggridpanel',
          contentId:id,
          region:'south',
          height:150,
          collapsible:true,
          centerRegion:self,
          siteId:siteId
        });
      }
      else{
        items.push({
          xtype:'knitkit_nonpublishedversionswebsitesectiongridpanel',
          contentId:id,
          region:'south',
          height:150,
          collapsible:true,
          centerRegion:self
        });
      }

      item = Ext.create("Ext.panel.Panel",{
        layout:'border',
        title:title,
        closable:true,
        items:items,
        itemId:itemId,
        listeners:{
          'show':function(panel){
            if(!Compass.ErpApp.Utility.isBlank(siteId)){
              Ext.getCmp('knitkitWestRegion').selectWebsite(siteId);
            }
          }
        }
      });

      this.workArea.add(item);
    }
    
    this.workArea.setActiveTab(item);
  },

  saveContent : function(id, content, contentType){
    var self = this;
    this.setWindowStatus('Saving...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/content/update',
      method: 'POST',
      params:{
        id:id,
        html:content
      },
      success: function(response) {
        var obj =  Ext.decode(response.responseText);
        if(obj.success){
          self.clearWindowStatus();
          if(!Compass.ErpApp.Utility.isBlank(contentType)){
            var activeTab = self.workArea.getActiveTab();
            var panel = activeTab.query('knitkit_versions'+contentType+'gridpanel');
            if(panel.length == 0){
              panel = activeTab.query('knitkit_nonpublishedversionswebsitesectiongridpanel');
            }
            panel[0].getStore().load();
          }
        }
        else{
          Ext.Msg.alert('Error', 'Error saving contents');
          self.clearWindowStatus();
        }
      },
      failure: function(response) {
        self.clearWindowStatus();
        Ext.Msg.alert('Error', 'Error saving contents');
      }
    });
  },

  viewContent : function(title, content){
    var ckEditor = Ext.create("Compass.ErpApp.Shared.CKeditor",{
      autoHeight:true,
      value:content,
      ckEditorConfig:{
        toolbar:[['Preview']]
      }
    });

    var item = Ext.create('Ext.panel.Panel',{
      closable:true,
      layout:'fit',
      title:title,
      split:true,
      items:ckEditor,
      autoDestroy:true
    });

    this.workArea.add(item);
    this.workArea.setActiveTab(item);
  },

  editContent : function(title, id, content, siteId, contentType, contentGridStore){
    var self = this;
    var itemId = 'editContent-'+id;
    var item = this.workArea.query('#'+itemId).first();

    if(Compass.ErpApp.Utility.isBlank(item)){
      var ckEditor = Ext.create("Compass.ErpApp.Shared.CKeditor",{
        autoHeight:true,
        //value:content,
        ckEditorConfig:{
          extraPlugins:'compasssave,jwplayer', // removed codemirror plugin as it is unstable
          toolbar:self.ckEditorToolbar
        },
        listeners:{
          'save':function(ckEditor, content){
            if (currentUser.hasApplicationCapability('knitkit', {
              capability_type_iid:'edit_html',
              resource:'Article'
            }))
            {
              self.saveContent(id, content, contentType);
							if (contentGridStore){
								contentGridStore.load();
							}
              
            }else{
              currentUser.showInvalidAccess();
            }
          }
        }
      });

      ckEditor.setValue(content);

      var items = [
      {
        xtype:'panel',
        layout:'fit',
        split:true,
        region:'center',
        items:ckEditor,
        autoDestroy:true
      }
      ];

      if(!Compass.ErpApp.Utility.isBlank(siteId)){
        items.push({
          xtype:'knitkit_versions'+contentType+'gridpanel',
          contentId:id,
          region:'south',
          height:150,
          collapsible:true,
          centerRegion:self,
          siteId:siteId
        });
      }
      else{
        items.push({
          xtype:'knitkit_nonpublishedversionswebsitesectiongridpanel',
          contentId:id,
          region:'south',
          height:150,
          collapsible:true,
          centerRegion:self
        });
      }

      item = Ext.create('Ext.panel.Panel',{
        xtype:'panel',
        layout:'border',
        title:title,
        itemId:itemId,
        closable:true,
        items:items,
        listeners:{
          'show':function(panel){
            if(!Compass.ErpApp.Utility.isBlank(siteId)){
              Ext.getCmp('knitkitWestRegion').selectWebsite(siteId);
            }
          }
        }
      });

      this.workArea.add(item);
    }

    this.workArea.setActiveTab(item);
  },

  showComment : function(comment){
    var activeTab = this.workArea.getActiveTab();
    var cardPanel = activeTab.query('panel')[0];
    cardPanel.removeAll(true);
    cardPanel.add({
      xtype:'panel',
      html:comment
    });
    cardPanel.getLayout().setActiveItem(0);
  },

  viewContentComments : function(contentId, title){
    var self = this;
    var itemId = 'contentComments-'+contentId;
    var item = this.workArea.query('#'+itemId).first();

    if(Compass.ErpApp.Utility.isBlank(item)){
      item = Ext.create("Ext.panel.Panel",{
        layout:'border',
        itemId:itemId,
        title:title,
        closable:true,
        items:[
        {
          xtype:'panel',
          layout:'card',
          split:true,
          region:'center',
          items:[],
          autoDestroy:true
        },
        {
          xtype:'knitkit_commentsgridpanel',
          contentId:contentId,
          region:'south',
          height:300,
          collapsible:true,
          centerRegion:self
        }
        ]
      });
      this.workArea.add(item);
    }
    
    this.workArea.setActiveTab(item);
  },

  viewWebsiteInquiries : function(websiteId, title){
    var self = this;
    var itemId = 'websiteInqueries-'+websiteId;
    var item = this.workArea.query('#'+itemId).first();

    if(Compass.ErpApp.Utility.isBlank(item)){
      item = {
        xtype:'panel',
        layout:'border',
        title:title + " Inquiries",
        itemId:itemId,
        closable:true,
        items:[
        {
          xtype:'panel',
          layout:'card',
          split:true,
          region:'center',
          items:[],
          autoDestroy:true
        },
        {
          xtype:'knitkit_inquiriesgridpanel',
          websiteId:websiteId,
          region:'south',
          height:300,
          collapsible:true,
          centerRegion:self
        }
        ],
        listeners:{
          'show':function(panel){
            Ext.getCmp('knitkitWestRegion').selectWebsite(websiteId);
          }
        }
      };

      this.workArea.add(item);
    }
    
    this.workArea.setActiveTab(item);
  },

  insertHtmlIntoActiveCkEditor : function(html){
    var activeTab = this.workArea.getActiveTab();
    if(Compass.ErpApp.Utility.isBlank(activeTab)){
      Ext.Msg.alert('Error', 'No editor');
    }
    else{
      if(activeTab.query('ckeditor').length == 0){
        Ext.Msg.alert('Error', 'No ckeditor found');
      }
      else{
        activeTab.query('ckeditor')[0].insertHtml(html);
      }
    }
    return false;
  },

  replaceHtmlInActiveCkEditor : function(html){
    var activeTab = this.workArea.getActiveTab();
    if(Compass.ErpApp.Utility.isBlank(activeTab)){
      Ext.Msg.alert('Error', 'No editor');
    }
    else{
      if(activeTab.query('ckeditor').length == 0){
        Ext.Msg.alert('Error', 'No ckeditor found');
      }
      else{
        activeTab.query('ckeditor')[0].setValue(html);
      }
    }
    return false;
  },

  replaceContentInActiveCodeMirror : function(content){
    var activeTab = this.workArea.getActiveTab();
    if(Compass.ErpApp.Utility.isBlank(activeTab)){
      Ext.Msg.alert('Error', 'No editor');
    }
    else{
      if(activeTab.query('codemirror').length == 0){
        Ext.Msg.alert('Error', 'No codemirror found.');
      }
      else{
        activeTab.query('codemirror')[0].setValue(content);
      }
    }
    return false;
  },

  addContentToActiveCodeMirror : function(content){
    var activeTab = this.workArea.getActiveTab();
    if(Compass.ErpApp.Utility.isBlank(activeTab)){
      Ext.Msg.alert('Error', 'No editor');
    }
    else{
      if(activeTab.query('codemirror').length == 0){
        Ext.Msg.alert('Error', 'No codemirror found. Note that a widget can only be added to a Layout.');
      }
      else{
        activeTab.query('codemirror')[0].insertContent(content);
      }
    }
    return false;
  },
  
  constructor : function(config) {
    this.workArea = Ext.createWidget('tabpanel', {
      autoDestroy:true,
      region:'center',
      plugins: Ext.create('Ext.ux.TabCloseMenu', {
        extraItemsTail: [
        '-',
        {
          text: 'Closable',
          checked: true,
          hideOnClick: true,
          handler: function (item) {
            currentItem.tab.setClosable(item.checked);
          }
        }
        ],
        listeners: {
          aftermenu: function () {
            currentItem = null;
          },
          beforemenu: function (menu, item) {
            var menuitem = menu.child('*[text="Closable"]');
            currentItem = item;
            menuitem.setChecked(item.closable);
          }
        }
      })
    });
        
    config = Ext.apply({
      id:'knitkitCenterRegion',
      autoDestroy:true,
      layout:'border',
      region:'center',
      split:true,
      items:[this.workArea]
    }, config);

    this.callParent([config]);
  }
});