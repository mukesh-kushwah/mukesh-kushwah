/*    Custom.js      */
/*    Custom.js      */
/* ================ */

	// Make sure jQuery has been loaded
	if (typeof jQuery === 'undefined') {
		throw new Error('Requires jQuery')
	}

	/* Layout()
	* ========
	* Implements AdminLTE layout.
	* Fixes the layout height in case min-height fails.
	*
	* @usage activated automatically upon window load.
	*        Configure any options by passing data-option="value"
	*        to the body tag.
	*/
	+function ($) {
		'use strict'

		var DataKey = 'lte.layout'

		var Default = {
			slimscroll : true,
			resetHeight: true
		}

		var Selector = {
			wrapper       : '.wrapper',
			contentWrapper: '.content-wrapper',
			layoutBoxed   : '.layout-boxed',
			mainFooter    : '.main-footer',
			mainHeader    : '.main-header',
			sidebar       : '.sidebar',
			controlSidebar: '.control-sidebar',
			fixed         : '.fixed',
			sidebarMenu   : '.sidebar-menu',
			logo          : '.main-header .logo'
		}

		var ClassName = {
			fixed         : 'fixed',
			holdTransition: 'hold-transition'
		}

		var Layout = function (options) {
			this.options      = options
			this.bindedResize = false
			this.activate()
		}

		Layout.prototype.activate = function () {
			this.fix()
			this.fixSidebar()

			$('body').removeClass(ClassName.holdTransition)

			if (this.options.resetHeight) {
				$('body, html, ' + Selector.wrapper).css({
					'height'    : 'auto',
					'min-height': '100%'
				})
			}

			if (!this.bindedResize) {
				$(window).resize(function () {
					this.fix()
					this.fixSidebar()

					$(Selector.logo + ', ' + Selector.sidebar).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
						this.fix()
						this.fixSidebar()
					}.bind(this))
				}.bind(this))

				this.bindedResize = true
			}

			$(Selector.sidebarMenu).on('expanded.tree', function () {
				this.fix()
				this.fixSidebar()
			}.bind(this))

			$(Selector.sidebarMenu).on('collapsed.tree', function () {
				this.fix()
				this.fixSidebar()
			}.bind(this))
		}

		Layout.prototype.fix = function () {
			// Remove overflow from .wrapper if layout-boxed exists
			$(Selector.layoutBoxed + ' > ' + Selector.wrapper).css('overflow', 'hidden')

			// Get window height and the wrapper height
			var footerHeight  = $(Selector.mainFooter).outerHeight() || 0
			var neg           = $(Selector.mainHeader).outerHeight() + footerHeight
			var windowHeight  = $(window).height()
			var sidebarHeight = $(Selector.sidebar).height() || 0

			// Set the min-height of the content and sidebar based on
			// the height of the document.
			if ($('body').hasClass(ClassName.fixed)) {
				$(Selector.contentWrapper).css('min-height', windowHeight - footerHeight)
			} else {
				var postSetHeight

				if (windowHeight >= sidebarHeight) {
					$(Selector.contentWrapper).css('min-height', windowHeight - neg)
					postSetHeight = windowHeight - neg
				} else {
					$(Selector.contentWrapper).css('min-height', sidebarHeight)
					postSetHeight = sidebarHeight
				}

				// Fix for the control sidebar height
				var $controlSidebar = $(Selector.controlSidebar)
				if (typeof $controlSidebar !== 'undefined') {
					if ($controlSidebar.height() > postSetHeight)
					$(Selector.contentWrapper).css('min-height', $controlSidebar.height())
				}
			}
		}

		Layout.prototype.fixSidebar = function () {
			// Make sure the body tag has the .fixed class
			if (!$('body').hasClass(ClassName.fixed)) {
				if (typeof $.fn.slimScroll !== 'undefined') {
					$(Selector.sidebar).slimScroll({ destroy: true }).height('auto')
				}
				return
			}

			// Enable slimscroll for fixed layout
			if (this.options.slimscroll) {
				if (typeof $.fn.slimScroll !== 'undefined') {
					// Destroy if it exists
					$(Selector.sidebar).slimScroll({ destroy: true }).height('auto')

					// Add slimscroll
					$(Selector.sidebar).slimScroll({
						height: ($(window).height() - $(Selector.mainHeader).height()) + 'px',
						color : 'rgba(0,0,0,0.2)',
						size  : '3px'
					})
				}
			}
		}

		// Plugin Definition
		// =================
		function Plugin(option) {
			return this.each(function () {
				var $this = $(this)
				var data  = $this.data(DataKey)

				if (!data) {
					var options = $.extend({}, Default, $this.data(), typeof option === 'object' && option)
					$this.data(DataKey, (data = new Layout(options)))
				}

				if (typeof option === 'string') {
					if (typeof data[option] === 'undefined') {
						throw new Error('No method named ' + option)
					}
					data[option]()
				}
			})
		}

		var old = $.fn.layout

		$.fn.layout            = Plugin
		$.fn.layout.Constuctor = Layout

		// No conflict mode
		// ================
		$.fn.layout.noConflict = function () {
			$.fn.layout = old
			return this
		}

		// Layout DATA-API
		// ===============
		$(window).on('load', function () {
			Plugin.call($('body'))
		})
	}(jQuery)


	/* PushMenu()
	* ==========
	* Adds the push menu functionality to the sidebar.
	*
	* @usage: $('.btn').pushMenu(options)
	*          or add [data-toggle="push-menu"] to any button
	*          Pass any option as data-option="value"
	*/
	+function ($) {
		'use strict'

		var DataKey = 'lte.pushmenu'

		var Default = {
			collapseScreenSize   : 767,
			expandOnHover        : false,
			expandTransitionDelay: 200
		}

		var Selector = {
			collapsed     : '.sidebar-collapse',
			open          : '.sidebar-open',
			mainSidebar   : '.main-sidebar',
			contentWrapper: '.content-wrapper',
			searchInput   : '.sidebar-form .form-control',
			button        : '[data-toggle="push-menu"]',
			mini          : '.sidebar-mini',
			expanded      : '.sidebar-expanded-on-hover',
			layoutFixed   : '.fixed'
		}

		var ClassName = {
			collapsed    : 'sidebar-collapse',
			open         : 'sidebar-open',
			mini         : 'sidebar-mini',
			expanded     : 'sidebar-expanded-on-hover',
			expandFeature: 'sidebar-mini-expand-feature',
			layoutFixed  : 'fixed'
		}

		var Event = {
			expanded : 'expanded.pushMenu',
			collapsed: 'collapsed.pushMenu'
		}

		// PushMenu Class Definition
		// =========================
		var PushMenu = function (options) {
			this.options = options
			this.init()
		}

		PushMenu.prototype.init = function () {
			if (this.options.expandOnHover
			|| ($('body').is(Selector.mini + Selector.layoutFixed))) {
				this.expandOnHover()
				$('body').addClass(ClassName.expandFeature)
			}

			$(Selector.contentWrapper).click(function () {
				// Enable hide menu when clicking on the content-wrapper on small screens
				if ($(window).width() <= this.options.collapseScreenSize && $('body').hasClass(ClassName.open)) {
					this.close()
				}
			}.bind(this))

			// __Fix for android devices
			$(Selector.searchInput).click(function (e) {
				e.stopPropagation()
			})
		}

		PushMenu.prototype.toggle = function () {
			var windowWidth = $(window).width()
			var isOpen      = !$('body').hasClass(ClassName.collapsed)

			if (windowWidth <= this.options.collapseScreenSize) {
				isOpen = $('body').hasClass(ClassName.open)
			}

			if (!isOpen) {
				this.open()
			} else {
				this.close()
			}
		}

		PushMenu.prototype.open = function () {
			var windowWidth = $(window).width()

			if (windowWidth > this.options.collapseScreenSize) {
				$('body').removeClass(ClassName.collapsed)
				.trigger($.Event(Event.expanded))
			}
			else {
				$('body').addClass(ClassName.open)
				.trigger($.Event(Event.expanded))
			}
		}

		PushMenu.prototype.close = function () {
			var windowWidth = $(window).width()
			if (windowWidth > this.options.collapseScreenSize) {
				$('body').addClass(ClassName.collapsed)
				.trigger($.Event(Event.collapsed))
			} else {
				$('body').removeClass(ClassName.open + ' ' + ClassName.collapsed)
				.trigger($.Event(Event.collapsed))
			}
		}

		PushMenu.prototype.expandOnHover = function () {
			$(Selector.mainSidebar).hover(function () {
				if ($('body').is(Selector.mini + Selector.collapsed)
				&& $(window).width() > this.options.collapseScreenSize) {
					this.expand()
				}
			}.bind(this), function () {
				if ($('body').is(Selector.expanded)) {
					this.collapse()
				}
			}.bind(this))
		}

		PushMenu.prototype.expand = function () {
			setTimeout(function () {
				$('body').removeClass(ClassName.collapsed)
				.addClass(ClassName.expanded)
			}, this.options.expandTransitionDelay)
		}

		PushMenu.prototype.collapse = function () {
			setTimeout(function () {
				$('body').removeClass(ClassName.expanded)
				.addClass(ClassName.collapsed)
			}, this.options.expandTransitionDelay)
		}

		// PushMenu Plugin Definition
		// ==========================
		function Plugin(option) {
			return this.each(function () {
				var $this = $(this)
				var data  = $this.data(DataKey)

				if (!data) {
					var options = $.extend({}, Default, $this.data(), typeof option == 'object' && option)
					$this.data(DataKey, (data = new PushMenu(options)))
				}

				if (option == 'toggle') data.toggle()
			})
		}

		var old = $.fn.pushMenu

		$.fn.pushMenu             = Plugin
		$.fn.pushMenu.Constructor = PushMenu

		// No Conflict Mode
		// ================
		$.fn.pushMenu.noConflict = function () {
			$.fn.pushMenu = old
			return this
		}

		// Data API
		// ========
		$(document).on('click', Selector.button, function (e) {
			e.preventDefault()
			Plugin.call($(this), 'toggle')
		})
		$(window).on('load', function () {
			Plugin.call($(Selector.button))
		})
	}(jQuery)


	/* Tree()
	* ======
	* Converts a nested list into a multilevel
	* tree view menu.
	*
	* @Usage: $('.my-menu').tree(options)
	*         or add [data-widget="tree"] to the ul element
	*         Pass any option as data-option="value"
	*/
	+function ($) {
		'use strict'

		var DataKey = 'lte.tree'

		var Default = {
			animationSpeed: 500,
			accordion     : true,
			followLink    : false,
			trigger       : '.treeview a'
		}

		var Selector = {
			tree        : '.tree',
			treeview    : '.treeview',
			treeviewMenu: '.treeview-menu',
			open        : '.menu-open, .active',
			li          : 'li',
			data        : '[data-widget="tree"]',
			active      : '.active'
		}

		var ClassName = {
			open: 'menu-open',
			tree: 'tree'
		}

		var Event = {
			collapsed: 'collapsed.tree',
			expanded : 'expanded.tree'
		}

		// Tree Class Definition
		// =====================
		var Tree = function (element, options) {
			this.element = element
			this.options = options

			$(this.element).addClass(ClassName.tree)

			$(Selector.treeview + Selector.active, this.element).addClass(ClassName.open)

			this._setUpListeners()
		}

		Tree.prototype.toggle = function (link, event) {
			var treeviewMenu = link.next(Selector.treeviewMenu)
			var parentLi     = link.parent()
			var isOpen       = parentLi.hasClass(ClassName.open)

			if (!parentLi.is(Selector.treeview)) {
				return
			}

			if (!this.options.followLink || link.attr('href') == '#') {
				event.preventDefault()
			}

			if (isOpen) {
				this.collapse(treeviewMenu, parentLi)
			} else {
				this.expand(treeviewMenu, parentLi)
			}
		}

		Tree.prototype.expand = function (tree, parent) {
			var expandedEvent = $.Event(Event.expanded)

			if (this.options.accordion) {
				var openMenuLi = parent.siblings(Selector.open)
				var openTree   = openMenuLi.children(Selector.treeviewMenu)
				this.collapse(openTree, openMenuLi)
			}

			parent.addClass(ClassName.open)
			tree.slideDown(this.options.animationSpeed, function () {
				$(this.element).trigger(expandedEvent)
			}.bind(this))
		}

		Tree.prototype.collapse = function (tree, parentLi) {
			var collapsedEvent = $.Event(Event.collapsed)

			tree.find(Selector.open).removeClass(ClassName.open)
			parentLi.removeClass(ClassName.open)
			tree.slideUp(this.options.animationSpeed, function () {
				tree.find(Selector.open + ' > ' + Selector.treeview).slideUp()
				$(this.element).trigger(collapsedEvent)
			}.bind(this))
		}

		// Private

		Tree.prototype._setUpListeners = function () {
			var that = this

			$(this.element).on('click', this.options.trigger, function (event) {
				that.toggle($(this), event)
			})
		}

		// Plugin Definition
		// =================
		function Plugin(option) {
			return this.each(function () {
				var $this = $(this)
				var data  = $this.data(DataKey)

				if (!data) {
					var options = $.extend({}, Default, $this.data(), typeof option == 'object' && option)
					$this.data(DataKey, new Tree($this, options))
				}
			})
		}

		var old = $.fn.tree

		$.fn.tree             = Plugin
		$.fn.tree.Constructor = Tree

		// No Conflict Mode
		// ================
		$.fn.tree.noConflict = function () {
			$.fn.tree = old
			return this
		}

		// Tree Data API
		// =============
		$(window).on('load', function () {
			$(Selector.data).each(function () {
				Plugin.call($(this))
			})
		})

	}(jQuery)
	
	/*------------------------------------------------------------------------*/
	/* Data tables JS */
	function table_refresh(){
		$(function () {
			if($('#datatable:visible').length > 0){
				$('#datatable').DataTable({
					'paging'      : true,
					'lengthChange': false,
					'searching'   : true,
					'order'		  : [[ 0, "desc" ]],
					'info'        : true,
					'autoWidth'   : false,
				});
			}
			
			if($('.data_table').length > 0){
				$('.data_table').DataTable({
					'paging'      : true,
					'lengthChange': false,
					'searching'   : true,
					'order'       : [[ 0, "desc" ]],
					'info'        : true,
					'autoWidth'   : false,
				});
			}
		});
	}
	
	function refresh_data_table(table_id){
		if($('#'+table_id).length > 0){
			if(table_id == 'emp_datatable' || table_id == 'terminate_datatable' 
				|| table_id == 'withdraw_emp_datatable' || table_id == 'admin_table' 
				|| table_id == 'terminate_admin_table' || table_id == 'withdrawl_admin_datatable' || table_id == 'entlve_datatable'){
				$('#'+table_id).DataTable({
					'paging'      : true,
					'lengthChange': true,
					'searching'   : true,
					'ordering'    : true,
					'info'        : true,
					'autoWidth'   : false,
				});
			}else{
				$('#'+table_id).DataTable({
					'paging'      	: true,
					'lengthChange'	: true,
					'searching'   	: true,
					'ordering'    	: true,
					'info'        	: true,
					'autoWidth'   	: false,
					"fnRowCallback" : function(nRow, aData, iDisplayIndex){
						$("td:first", nRow).html(iDisplayIndex +1);
						return nRow;
					},
				});
			}
		}
	}
	
	/*------------------------------------------------------------------------*/
	// FOR SUCCESS MESSAGE FADE OUT
	jQuery(document).ready(function(){
		/* fadeout flash message */
		jQuery('.cancel').click(function(){
			jQuery(this).parent().fadeOut();
		});	
		jQuery('.success').animate({opacity: 1.0}, 3000).fadeOut();
		table_refresh();
		
		refresh_data_table('lt_datatable');
		refresh_data_table('el_datatable');
		refresh_data_table('jp_datatable');
		refresh_data_table('js_datatable');
		refresh_data_table('admin_table');
		refresh_data_table('sk_datatable');
		refresh_data_table('ed_datatable');
		refresh_data_table('branches_datatable');
		refresh_data_table('company_datatable');
		refresh_data_table('userrole_datatable');
		refresh_data_table('user_datatable');
		refresh_data_table('branch_type_datatable');
		refresh_data_table('emp_datatable');
		refresh_data_table('document_datatable');
		refresh_data_table('terminate_datatable');
		refresh_data_table('branch_doc_datatable');
		refresh_data_table('emp_doc_datatable');
		refresh_data_table('emergency_contact_datatable');
		refresh_data_table('withdraw_emp_datatable');
		refresh_data_table('travel_datatable');
		refresh_data_table('user_emergency_contact_datatable');
		refresh_data_table('admin_emergency_contact_datatabel');
		refresh_data_table('terminate_admin_table');
		refresh_data_table('withdrawl_admin_datatable');
		refresh_data_table('employee_skils_datatable');
		refresh_data_table('client_datatable');
		refresh_data_table('setting_branch_datatable');
		refresh_data_table('project_datatable');
		refresh_data_table('assigned_projects_datatable');
		refresh_data_table('holiday_datatable');
		refresh_data_table('event_datatable');
		refresh_data_table('full_attendance_table');
		refresh_data_table('attendance_table');
		refresh_data_table('message_datatable');
		refresh_data_table('wish_datatable');
		refresh_data_table('inbox_msg_datatable');
		refresh_data_table('inbox_wish_table');
		refresh_data_table('entlve_datatable');
		refresh_data_table('emp_leave_datatable');
		refresh_data_table('attendance_note_table');
		refresh_data_table('vk_datatable');
		refresh_data_table('pk_datatable');
		refresh_data_table('rk_datatable');
	});
	
	/*------------------------------------------------------------------------*/
	// EDIT PASSWORD
	jQuery(document).ready(function(){
		jQuery('.editpassword').click(function(){
			jQuery('#pencrypt').hide();
			jQuery('.passwordsection').show();
		});
		
		// TO SHOW DATEPICKER
		$('.datepicker').datepicker({
			dateFormat: "yy-mm-dd" ,
		});
		
		// TO SHOW DATETIMEPICKER
		 $('.datetimepicker').datetimepicker({
			format: 'Y-M-D  hh:mm a'
		 });
	});

//TO ADD ADMIN AJEX
jQuery(document).on('submit', '#admin_form', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/admins/add_admin',
		data     	: formData,
		contentType	: false,       // The content type used when sending data to the server.
		cache		: false,             // To unable request pages to be cached
		processData	: false,
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			if(response == "no"){
				alert('This user name is already exists.Please select another user name.');
			}else{
				jQuery('#reg_popup').modal('hide');
				document.getElementById("admin_form").reset();
				$.get(template_url+ "admin/admins/refresh_add_admin", function(attendance_list){ 
				$(".panel-bd").html(attendance_list);
				table_refresh();
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

//IMAGE PREVIEW FOR ADD ADMIN 
function readURL(input,type) {
	if(type == 'pdf'){
		var fileExtension = ['pdf'];
		if ($.inArray($(input).val().split('.').pop().toLowerCase(), fileExtension) == -1) {
			alert("Only formats are allowed : "+fileExtension.join(', ')); 
			jQuery(input).val('');
			return;
		}
	}
	if (input.files && input.files[0]) {
		var reader 		  = new FileReader();
		var template_url  = jQuery('#template_url').val();
		var dataid 		  = jQuery('.admin_image').attr('data-id');
		var form_data     = jQuery('.view_image_form').serialize();
		var form          = jQuery('.view_image_form')[0];
		var formData      = new FormData(form);
		var This          = jQuery(input);
		var reader 		  = new FileReader();
		
		// To show file name
		if(type == 'pdf'){
			This.parents('.form-group').siblings('.p-wrap').find('.file-name').html(input.files[0].name);
		}
		reader.onload = function (e) {
			if(type == 'pdf'){
				This.parents('.form-group').siblings('.p-wrap').find('.preview').html('<img src="'+template_url+'assets/images/file-icon.png" alt="File"/>');
			}else{
				$('.user_img').attr('src', e.target.result);
				$('input.travel_reciept_file').prev('.travel_file').children('img').attr('src', template_url+'assets/images/file-icon.png');
				if(!(dataid == '' || dataid == null)){
					$.ajax({
						type     	: 'post',
						url      	: template_url+'admin/employee/image_load_click/'+dataid,
						data     	: formData,
						contentType	: false,       // The content type used when sending data to the server.
						cache		: false,             // To unable request pages to be cached
						processData	: false,
						success  	: function(response){
							if(jQuery('.view_emp_img').find('.image_delete').length == 0){
								jQuery('.view_emp_img').append('<a href="javascript:void(0)" class="image_delete"><i class="fa fa-times"></i></a>');
							}
						}
					});
				}
			}
		}
		reader.readAsDataURL(input.files[0]);
	}
}

/*jQuery(document).on('click', '.travel_reciept_file', function(e){
	readURL(this);

});*/

//FUNCTION GET ID FOR EDIT ADMIN
jQuery(document).on('click', '.edit-admin-btn', function(e){
	
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var dataid 		 = jQuery(this).attr('data-id');
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/admins/edit_admin/'+dataid,
		success  : function(response){
			// change button label 
			$("#add_admin_detail .modal-body").html(response);
			//jQuery(".status_select").select2({placeholder: 'None'});
			jQuery('#add_admin_detail').modal('show');
		}
	});
});

//FUNCTION GET ID FOR VIEW ADMIN
jQuery(document).on('click', '.view_admin_btn', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var dataaid 	 = jQuery(this).attr('data-id');
	
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/admins/view_admin/'+dataaid,
		success  : function(response){
			// change button label 
			$("#view_admins_detail .modal-body").html(response);
			jQuery(".status_select").select2({placeholder: 'None'});
			jQuery('#view_admins_detail').modal('show');
		}
	});
});

$(function() {
	jQuery(document).on('click', '.punch-btn', function(e){
		var latest_id_row 	= $("#latest_id_row").val();
		$('.punchin-wrp').fadeIn(500);
		$( "#latest_id" ).val(latest_id_row);
		var currentdate = new Date(); 
	
		var datetime = currentdate.getFullYear() + "-"  
						+ ("0" + (currentdate.getMonth() + 1)).slice(-2)+ "-"							
						+ currentdate.getDate() + " "
						+ currentdate.getHours() + ":"  
						+ currentdate.getMinutes() + ":" 
						+ currentdate.getSeconds();
		$( "#punch_time" ).val(datetime);
		$('#datetimepicker5').datetimepicker({
		   format:'YYYY-MM-DD HH:mm:ss',
		   ignoreReadonly: true
		});
	});
	
	// REMOVE FROM ON CLICK CANSEL BUTTON
	jQuery(document).on('click', '.button-section .cancel-btn', function(e){
		jQuery('#edit_attendence').modal('hide');
	});
});

jQuery(document).on('change','.select-note .note',function(){
	if(jQuery(this).val() == 'other') {
		jQuery('.other_note').show(); 
	} else {
		jQuery('.other_note').hide(); 
	} 
});


//FUNCTION FOR EDIT ADMIN PAGE WITHOUT REFRESH
jQuery(document).on('submit', '#edit_admin_form', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var id 			 = jQuery('#admin_id').val();
	var form_data    = jQuery(this).serialize();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/admins/edit_admin/'+id,
		data     	: formData,
		contentType	: false,       // The content type used when sending data to the server.
		cache		: false,             // To unable request pages to be cached
		processData	: false,
		beforeSend 	: function(){
					$('.tabel-responsive .overlay').show();
				},
		success  	: function(response){
			jQuery('#add_admin_detail').modal('hide');
			document.getElementById("edit_admin_form").reset();
			$.get(template_url+ "admin/admins/refresh_add_admin", function(attendance_list){ 
				$(".panel-bd").html(attendance_list);
				table_refresh();
			});
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

//FUNCTION TO DELETE ADMINS DETAILS
jQuery(document).on('click', '.delete_admins', function(e){
	
	if(!confirm('Are you sure want to delete')){
		return false;
	}
	e.preventDefault();
	
	var template_url 	= jQuery('#template_url').val();
	var data_id 		= $(this).attr('data-id');
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/admins/delete_admin/'+data_id,
		beforeSend 	: function(){
				$('.tabel-responsive .overlay').show();
				},
		success     :function(response){
			$.get(template_url+ "admin/admins/refresh_add_admin", function(attendance_list){
				$(".panel-bd").html(attendance_list);				
				table_refresh();
			});
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});	

// For tabbing 
jQuery(document).ready(function(){
	jQuery( ".tab_menu" ).tabs();
});

//FUNCTION SHOW ADD EMPLOYEE FORM
jQuery(document).on('click', '.add_employee_btn', function(e){
	$('#add_employee').show();
	$('#employee_panel').hide();
});

//FUNCTION SHOW ADD Client FORM
jQuery(document).on('click', '.add_client_btn', function(e){
	$('#add_client').show();
	$('#add_client_panel').hide();
});

//FUNCTION HIDE ADD Client FORM
jQuery(document).on('click', '.close_client_btn', function(e){
	$('#add_client').hide();
	$('#add_client_panel').show();
});

//FUNCTION GET ID FOR VIEW EMPLOYEE
/*jQuery(document).on('click', '.view_travel_btn', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var dataid 		 = jQuery(this).attr('data-id');
	var panel 		 = jQuery(this).attr('data-panel');
	
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/employee/view_travel_administration/'+dataid,
		success  : function(response){
			
			$('.'+panel).html(response);
			jQuery(".status_select_country").select2({placeholder: 'None'});
		}
	});
});*/

//FUNCTION GET ID FOR VIEW EMPLOYEE
jQuery(document).on('click', '.staff_view_travel_btn', function(e){
	
	e.preventDefault();
	var template_url 	= jQuery('#template_url').val();
	var dataid 			= jQuery(this).attr('data-id');
	var panel 			= jQuery(this).attr('data-panel');
	
	$.ajax({
		type     : 'post',
		url      : template_url+'staff/travel_administration/staff_view_travel_administration/'+dataid,
		success  : function(response){
			//$('#edit_employee');
			$('.'+panel).html(response);
			jQuery(".status_select_country").select2({placeholder: 'None'});
		}
	});
});


// FUNCTION TO ADD AND UPDATE DATA
//----------------------------------------------------------
jQuery(document).on('submit', '.form_data', function(e){
	e.preventDefault();
	
	var template_url = jQuery('#template_url').val();
	var form_action  = jQuery(this).find('.form_action').val();
	var ref_content  = jQuery(this).find('.ref_content').val();
	var content      = ref_content;
	var ref_url      = jQuery(this).find('.ref_url').val();
	var table_id     = jQuery(this).find('.ref_table_id').val();
	var edit_id      = jQuery(this).find('.edit_id').val();
	var panel_id     = jQuery(this).find('.panel_id').val();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	
	var This  		 = jQuery(this)
	if(!(edit_id == null || edit_id == '')){
		ref_content = ref_content +'/'+ edit_id;
	}
	// For attendance (add and edit section)
	if(content == 'full_attendance'){
		var punch_in_time  = new Date(jQuery('#punch_in').val()).getTime();
		var punch_out_time = new Date(jQuery('#punch_out').val()).getTime();
		if(punch_out_time < punch_in_time){
			Lobibox.alert('warning', {
				sound: false,
				msg:'Time out can\'t be less time in'
			});
			return;
		}
	}
	
	if(panel_id === 'staff_calendar_view'){
		Lobibox.confirm({
		msg 		: "Are you sure,submit this form?",
		callback 	: function ($this, type) {
			if (type === 'yes') {
				$('#management_popup').modal('hide');
				$.ajax({
					type     	: 'post',
					url      	: template_url+"staff/timesheet/add_in_timesheet",
					data     	: formData,
					contentType	: false,       // The content type used when sending data to the server.
					cache		: false,             // To unable request pages to be cached
					processData	: false,
					dataType 	: 'json',
					beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
							},
					success  	: function(response){
						if(response.success){
							jQuery('#management_popup').modal('hide');
							jQuery(".select2_drop").select2({placeholder: 'None'});
							jQuery("#ind_sup_select").select2({placeholder: 'None'});
							
							
									var ref_url1	= 'dashboard/refresh_content';
									$.get(ref_url1 + '/staff_calendar_view', function(staff_calendar_view){
										$(".content #staff_calendar_view").html(staff_calendar_view);
									});
									$.get(ref_url1 + '/task_panel/task_panel', function(task_panel){
										$(".content #task_panel").html(task_panel);
										refresh_data_table('holiday_datatable');								
									});
									$.get(ref_url1 + '/pending_task/pending_task', function(pending_task){
										$(".content #pending_task").html(pending_task);
										refresh_data_table('pk_datatable');
									});
									$.get(ref_url1 + '/approve_task/approve_task', function(approve_task){
										$(".content #approve_task").html(approve_task);
										refresh_data_table('rk_datatable');
									});
									$.get(ref_url1 + '/decline_task/decline_task', function(decline_task){
										$(".content #decline_task").html(decline_task);
										refresh_data_table('vk_datatable');
									});
									datepicker();
									// TO SHOW SUCCESS MESSAGE
									Lobibox.notify('success', {
										sound: false,
										msg:response.success_msg
									});
								}
								else{
									// TO SHOW SUCCESS MESSAGE
									Lobibox.notify('success', {
									sound: false,
									msg:response.success_msg
									});
								}	
							},
							complete : function(){
								$('.tabel-responsive .overlay').hide();
							}
						});
					}
				}		
			});
		}
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+form_action,
		data     	: formData,
		contentType	: false,       // The content type used when sending data to the server.
		cache		: false,             // To unable request pages to be cached
		processData	: false,
		dataType 	: 'json',
		beforeSend 	: function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	: function(response){
			if(response.success){
				jQuery('#management_popup').modal('hide');
				jQuery(".select2_drop").select2({placeholder: 'None'});
				jQuery("#ind_sup_select").select2({placeholder: 'None'});
				
				
					    var ref_url1		= 'dashboard/refresh_content';
						$.get(ref_url1 + '/staff_calendar_view', function(staff_calendar_view){
							$(".content #staff_calendar_view").html(staff_calendar_view);
							
						});
						$.get(ref_url1 + '/task_panel/task_panel', function(task_panel){
							$(".content #task_panel").html(task_panel);
							refresh_data_table('holiday_datatable');								
						});
						$.get(ref_url1 + '/pending_task/pending_task', function(pending_task){
							$(".content #pending_task").html(pending_task);
							refresh_data_table('pk_datatable');
						});
						$.get(ref_url1 + '/approve_task/approve_task', function(approve_task){
							$(".content #approve_task").html(approve_task);
							refresh_data_table('rk_datatable');
						});
						$.get(ref_url1 + '/decline_task/decline_task', function(decline_task){
							$(".content #decline_task").html(decline_task);
							refresh_data_table('vk_datatable');
						});
									
				// For calendar section
				if(!(response.s_date == null || response.s_date == '')){
					ref_content = ref_content + '/' + response.s_date;
				}
				if(!(ref_content == '' || ref_content == null)){
					$.get(template_url + ref_url + ref_content, function(html_view){ 
						if(content == 'view_employee'){
							$(".content #"+panel_id).find('.panel-body').html(html_view);
							scrollSmoothToTop();
						}else{
							if(content == 'calendar_view'){
								// To refresh calendar view page
								$(".content #"+content).html(html_view);
								
								// To refresh holiday page
								$.get(template_url + ref_url + 'holiday_panel', function(holiday_view){
									$(".content #holiday_panel").html(holiday_view);
									refresh_data_table('holiday_datatable');
								});
								
								// To refresh event page
								$.get(template_url + ref_url + 'event_panel', function(event_view){
									$(".content #event_panel").html(event_view);
									refresh_data_table('event_datatable');
								});
							}
							else{
								$(".content #"+content).html(html_view);
								if(!(table_id == '' || table_id == null)){
									refresh_data_table(table_id);
								}
								jQuery(".select2_drop").select2({placeholder: 'None'});
								
								// For messages panel
								if(table_id == 'message_datatable'){
									refresh_data_table('inbox_msg_datatable');
									jQuery('#sent_msg').siblings('.btab-content').removeClass('current');
									jQuery('.msg_panel .btab-link').removeClass('current');
									jQuery('#sent_msg, .msg_panel .btab-link[data-tab="sent_msg"]').addClass('current');
								}
								// For wishes panel
								if(table_id == 'wish_datatable'){
									refresh_data_table('inbox_wish_table');
									jQuery('#sent_wish').siblings('.btab-content').removeClass('current');
									jQuery('.wish_panel .btab-link').removeClass('current');
									jQuery('#sent_wish, .wish_panel .btab-link[data-tab="sent_wish"]').addClass('current');
								}
									
								if(table_id == 'wish_datatable'){
									refresh_data_table('inbox_wish_table');
									refresh_data_table('message_datatable');
								}
								if(table_id == 'inbox_wish_table'){
									refresh_data_table('wish_datatable');
									refresh_data_table('message_datatable');
								}	
								if(table_id == 'message_datatable'){
									refresh_data_table('wish_datatable');
									refresh_data_table('inbox_wish_table');
								}
								
									$.get(template_url + "admin/employee_leaves/refresh_content/employee_leaves_panel", function(employee_leaves_panel){
										$(".leaves_panel #employee_leaves_panel").html(employee_leaves_panel);
										refresh_data_table('project_datatable');
									});
								
								
								if(ref_content == 'all_my_leaves'){
									$.get(template_url + ref_url + 'pending_leaves', function(event_view){
										$(".content #pending_leaves").html(event_view);
										refresh_data_table('jp_datatable');	
										refresh_data_table('emp_leave_datatable');
																				
									});
									$.get(template_url + ref_url + 'leave_entitlement', function(event_view){
										$(".content #leave_entitlement").html(event_view);
										refresh_data_table('entlve_datatable');
										refresh_data_table('emp_leave_datatable');
										
									});
									$.get(template_url + ref_url + 'approved_leaves', function(approved_leaves){
										$(".content #approved_leaves").html(approved_leaves);
										refresh_data_table('el_datatable');
										refresh_data_table('emp_leave_datatable');
										
									});
									$.get(template_url + ref_url + 'all_my_leaves', function(all_my_leaves){
										$(".content #all_my_leaves").html(all_my_leaves);
										refresh_data_table('lt_datatable');
										refresh_data_table('emp_leave_datatable');
									});
								}
							}
						}
						
						//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'})
						$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
							  source: function( request, response ) {
								$.ajax({
									url: template_url+'admin/employee/search_username/',
									dataType: "json",
									data: request,
									success: function(data){
										if(data.response == 'true') {
										   response(data.message);
										}
									}
								});
							}
						});
						datepicker();
						// TO SHOW SUCCESS MESSAGE
						Lobibox.notify('success', {
							sound: false,
							msg:response.success_msg
						});
					});
				}else{
					// TO SHOW SUCCESS MESSAGE
					Lobibox.notify('success', {
						sound: false,
						msg:response.success_msg
					});
				}
				
			}else{
				if(response.error_msg != null){
					var error_msg = response.error_msg;
				}else{
					var error_msg = 'Some technical error occurred. Please try again.';
				}
	
				// TO SHOW ERROR MESSAGE
				/*Lobibox.notify('error', {
					sound: false,
					msg:error_msg
					
				});*/
				if(This.find('.form_error').length==0){
					This.prepend('<div class="form_error">'+error_msg+'</div>');
				}
				else{
					This.find('.form_error').html(error_msg);
					
				}
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

function redirect(url){
	window.location.href = url;
	return false;
}

/* FUNCTION TO DELETE DATA */
//------------------------------------------------------------------ 
function delete_data(table_name, delete_action, ref_content,table_id,date,staff_ref_url){
	var template_url 	= jQuery('#template_url').val();
	var content 		= ref_content;
	
	if((ref_content=='pending_task')||(ref_content=='task_panel')||(ref_content=='approve_task')||(ref_content=='decline_task')||(staff_ref_url=='staff_message')){
		var ref_url 		= 'staff/dashboard/refresh_content/';
	}	
	else{
		var ref_url 		= 'admin/company_loan/refresh_content/';
	}
	
	if(!(staff_ref_url == '' || staff_ref_url == null)){
		ref_url = staff_ref_url		
	}
	//THIS CONDITION FOR SET MESSAGE ACCORDING TO  TABLE NAME
	if(table_id == 'wish_datatable'){
		var mssg = "Are you sure, you want to Restore message?";
	}
	else{
		var mssg = "Are you sure, you want to Delete?";
	}	
	
	Lobibox.confirm({
		msg 		: mssg,
		callback 	: function ($this, type) {
			if (type === 'yes') {
				$('#management_popup').modal('hide');
				$.ajax({
					type     	: 'post',
					url      	: template_url+delete_action,
					data     	: {table_name:table_name},
					dataType 	: 'json',
					beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
							},
					success  	: function(response){
						if(response.success){
							
							// Changing url for calendar
							if(!(date == null || date == '')){
								ref_content = ref_content + '/' + date;
								ref_url     = 'admin/calendar/refresh_content/';
							}
							if(ref_content == 'pending_task'){
								var ref_url1 		= 'dashboard/refresh_content/';
								
								$.get(ref_url1 + 'staff_calendar_view', function(staff_calendar_view){
									$(".content #staff_calendar_view").html(staff_calendar_view);
								});	
								$.get(ref_url1 + 'task_panel/task_panel', function(pending_task){
									$(".content #task_panel").html(pending_task);
									refresh_data_table('holiday_datatable');
								});
								$.get(ref_url1 + 'approve_task/approve_task', function(pending_task){
									$(".content #approve_task").html(pending_task);
									refresh_data_table('jp_datatable');
								});
								$.get(ref_url1 + 'decline_task/decline_task', function(pending_task){
									$(".content #decline_task").html(pending_task);
									refresh_data_table('lt_datatable');
								});
							}	
							$.get(template_url+ ref_url + ref_content, function(loan_type_list){ 
								
								if(content == 'calendar_view'){
									// To refresh calendar view page
									$(".content #"+ content).html(loan_type_list);
									
									// To refresh holiday page
									$.get(template_url + ref_url + 'holiday_panel', function(holiday_view){
										$(".content #holiday_panel").html(holiday_view);
										refresh_data_table('holiday_datatable');
									});
									
									// To refresh event page
									$.get(template_url + ref_url + 'event_panel', function(event_view){
										$(".content #event_panel").html(event_view);
										refresh_data_table('event_datatable');
									});
								}
								else{
									$(".content #"+ref_content).html(loan_type_list);	
									refresh_data_table(table_id);
									jQuery(".select2_drop").select2({placeholder: 'None'});
									
									// For messages panel
									if(table_id == 'message_datatable'){
										//refresh_data_table('inbox_msg_datatable');
										//refresh_data_table('wish_datatable');
										jQuery('#sent_msg').siblings('.btab-content').removeClass('current');
										jQuery('.msg_panel .btab-link').removeClass('current');
										jQuery('#sent_msg, .msg_panel .btab-link[data-tab="sent_msg"]').addClass('current');
									}
									// For wishes panel
									if(table_id == 'wish_datatable'){
										//refresh_data_table('inbox_wish_table');
										jQuery('#sent_wish').siblings('.btab-content').removeClass('current');
										jQuery('.wish_panel .btab-link').removeClass('current');
										jQuery('#sent_wish, .wish_panel .btab-link[data-tab="sent_wish"]').addClass('current');
									}
									if(table_id == 'message_datatable'){
										refresh_data_table('inbox_msg_datatable');
										refresh_data_table('wish_datatable');
									}		
									if(table_id == 'inbox_msg_datatable'){
										refresh_data_table('wish_datatable');
										refresh_data_table('message_datatable');
									}
									if(table_id == 'wish_datatable'){
										refresh_data_table('inbox_msg_datatable');
										refresh_data_table('message_datatable');
									}
									if(content == 'all_my_leaves'){
										$.get(template_url + ref_url + 'pending_leaves', function(event_view){
											$(".content #pending_leaves").html(event_view);
											refresh_data_table('jp_datatable');
										});
										$.get(template_url + ref_url + 'leave_entitlement', function(event_view){
											$(".content #leave_entitlement").html(event_view);
											refresh_data_table('entlve_datatable');
										});
									}
									if(content == 'pending_leaves'){
										$.get(template_url + ref_url + 'all_my_leaves', function(event_view){
											$(".content #all_my_leaves").html(event_view);
											refresh_data_table('lt_datatable');
										});
										$.get(template_url + ref_url + 'leave_entitlement', function(event_view){
											$(".content #leave_entitlement").html(event_view);
											refresh_data_table('entlve_datatable');
										});
									}
								}
								//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'})
								$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
									  source: function( request, response ) {
										$.ajax({
											url		: template_url+'admin/employee/search_username/',
											dataType: "json",
											data	: request,
											success	: function(data){
												if(data.response == 'true') {
												   response(data.message);
												}
											}
										});
									}
								});
								datepicker();
							});
							//THIS CONDITION FOR SET SUCCESS MESSAGE ACCORDING TO  TABLE NAME
							// TO SHOW SUCCESS MESSAGE
							if(table_id == 'wish_datatable'){
								var mssg = "Data Restore successfully.";
							}
							else{
								var mssg = "Data deleted successfully.";
							}	
							Lobibox.notify('success', {
								sound	: false,
								msg		: mssg
							});
							
						}else{
							// TO SHOW ERROR MESSAGE
							Lobibox.notify('error', {
								sound	: false,
								msg		: 'Some technical error occurred.'
							});
						}
					},
					complete : function(){
						$('.tabel-responsive .overlay').hide();
					},
				});
			}
		}
	});
}

/* FUNCTION TO OPEN FORM MODAL */
//-------------------------------------------------------------- 
function open_form_modal(form_view,modal_title,id,action,type,post_para,date){
	var template_url = jQuery('#template_url').val();
	var ref_url 		= 'staff/dashboard/refresh_content/';
	
	if(form_view=='attendance_list_exl'){
		$("#management_popup").addClass("overflow_hidde");
	}
	
	if(!(action == '' || action == null)){
		var show_popup   = false;
		Lobibox.confirm({
			msg		: "Are you sure, "+ action +" this "+ type +" ?",
			callback: function ($this, type) {
				if (type === 'yes') {
					$.get(template_url+ "admin/admins/refresh_content/"+form_view +'/'+ id, function(form_content){ 
						jQuery('#management_popup').find('.modal-title').html(modal_title);
						jQuery('#management_popup').find('.modal-body').html(form_content);

						// TO SHOW DATETIMEPICKER
						datepicker();
						jQuery('#management_popup').modal('show');
						jQuery(".select2_drop").select2({placeholder: 'None'});
					});
				}
			}
		});
	}
	else{
		if ((form_view === "view_slip")|| (form_view === "add_task") || (form_view === "edit_task")){
			var Url = template_url+ "staff/dashboard/refresh_content/"+form_view +'/'+ id;
		}
		else{
			var Url = template_url+ "admin/admins/refresh_content/"+form_view +'/'+ id;
		}
		$.ajax({
			
			type     : 'post',
			url      : Url,
			data     : {post_para:post_para,date:date},
			success  : function(form_content){
				jQuery('#management_popup').find('.modal-title').html(modal_title);
				jQuery('#management_popup').find('.modal-body').html(form_content);
				
				// To show datetimepicker
				datepicker();
				
				jQuery('#management_popup').modal('show');
				jQuery(".select2_drop").select2({placeholder: 'None'});
				jQuery("#msg_to_select").select2({placeholder: 'None'});
				
				$.get(template_url + ref_url + 'notification', function(event_view){
					$(".wrapper #reload").html(event_view);
				});
				
											
				// To change ref_content while editing admin from terminated admin panel
				if(type == 'terminate'){
					jQuery('.ref_content').val('terminated_admin_panel');
					jQuery('.ref_table_id').val('terminate_admin_table');
				}
				
				// To change ref_content while editing admin from withdrawn admin panel
				if(type == 'withdrawl'){
					jQuery('.ref_content').val('withdrawl_admin_panel');
					jQuery('.ref_table_id').val('withdrawl_admin_datatable');
				}
				
				$( 'textarea.ckeditor').each( function() {
					CKEDITOR.replace( $(this).attr('id'),{
						height:'150px',
						width: '596px'
					});
				});
			}			
		});	
	}
}


/* FUNCTION SELECT BRANCH ON THE BASIS SELECT COMPANY */
//-----------------------------------------------------------
jQuery(document).on('change', '.company_select', function(e){
	e.preventDefault();
	var template_url 	= jQuery('#template_url').val();
    var selectedValue 	= $(this).val();
	
	 $.ajax({
		type     : 'post',
		url      : template_url+'admin/admins/select_company/'+selectedValue,
		success  : function(response){
			jQuery('select.branch_select').html(response);
			jQuery('.branch_select').parent().removeClass('no_branch');
		}
	});	
});

/* FUNCTION SELECT BRANCH ON THE BASIS SELECT COMPANY */
//-----------------------------------------------------------
jQuery(document).on('change', '.select_branch', function(e){
	e.preventDefault();
	var template_url 	= jQuery('#template_url').val();
    var selectedValue 	= $(this).val();
	 $.ajax({
		type     : 'post',
		url      : template_url+'admin/admins/select_branch/'+selectedValue,
		dataType : 'json',
		success  : function(response){
			jQuery('select.employee_select').html(response.employee);
			jQuery('select.branch_loan_type').html(response.branch);
			jQuery('.employee_select').parent().removeClass('no_branch');
			jQuery('.branch_loan_type').parent().removeClass('no_branch');
		}
	});	
});
/* FUNCTION TO SHOW ALERT IF BRANCH IS ALREADY ASSIGNED TO ANOTHER ADMIN */
//------------------------------------------------------------------------------
jQuery(document).on('change','.admin_form .branch_select', function(){
	var This			= $(this);
	var template_url  	= jQuery('#template_url').val();
    var branch_id     	= $(this).val();
	var admin_id      	= jQuery('#admin_id').val();
	var branch_select	= jQuery('.branch_select').val();
	
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/admins/check_branch/'+branch_id,
		dataType : 'json',
		success  : function(response){
			//alert(admin_id);
			if(response.admin_id != admin_id && response.admin_id != '' && branch_select != ''){
				Lobibox.confirm({
					msg: "This branch is already assigned, do you want to replace ?",
					callback: function ($this, type) {
						if (type === 'no') {	
							This.val('');
						}else{
							jQuery('.assing_branch_admin').val(response.admin_id);
						}
					}
				});
			}
		}
	});
});

/* FUNCTION TO CALCULATE MONTHLY INSTALLMENT AMOUNT */
//---------------------------------------------------------------
jQuery(document).on('blur','#loan_amount',function(){
	var loan_period = jQuery('#loan_period').val();
	var loan_amount = jQuery(this).val();
	if(loan_period != '' && loan_amount != ''){
		var monthly_install = loan_amount / loan_period;
		jQuery('#monthly_installment').val(monthly_install);
	}else{
		Lobibox.alert('warning', {
			sound: false,
			msg:'Please! enter valid Loan period and amount to calculate monthly installment.'
		});
	}
});

/* FUNCTION TO SHOW ALERT IF CHANGING ADMIN WHEM ADD NEW BRANCH */
//------------------------------------------------------------------
jQuery(document).on('change','.add_admins', function(){
	var template_url	= jQuery('#template_url').val();
    var admin_id		= $(this).val();
	var branch_id		= $('.branch_id').val();
	var This			= $(this);
	var add_admins		= jQuery('.add_admins').val();
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/company/check_admin/'+admin_id,
		dataType : 'json',
		success  : function(response){
			if(response.branch_id != branch_id && response.branch_id != '' && add_admins !=''){
				Lobibox.confirm({
					msg		: "This admin is already assigned, do you want to replace ?",
					callback: function ($this, type) {
						if (type === 'no') {	
							This.val('');
						}else{
							jQuery('.assing_admin_branch').val(response.branch_id);
						}
					}
				});
			}
		}
	});
});

/* FUNCTION TO SHOW ADMIN/EMPLOYEE LISTING ACCORDING TO LOGIN TYPE */
//------------------------------------------------------------------
jQuery(document).on('change', '.login_type', function(){
	var template_url  = jQuery('#template_url').val();
	var login_type    = jQuery(this).val();
	var This          = jQuery(this);
	//var user_id		  = jQuery(this).attr('data-id');
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/user/select_user/'+login_type,
		success  : function(response){
			This.parent().siblings('.user_selection').html(response);
		}
	});
});


/* FUNCTION TO SHOW EMPLOYEES OF A PARTICULAR BRANCH */
//----------------------------------------------------------------
jQuery(document).on('change', '.user_selection .branch_select', function(){
	var template_url  = jQuery('#template_url').val();
	var branch_id     = jQuery(this).val();
	var This          = jQuery(this);
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/user/get_employee/'+branch_id,
		success  : function(response){
			This.parent().siblings('.select_employee').html(response);
		}
	});
});

/* FUNCTION TO SHOW FORM VIEW IN RESPECTIVE PANEL */
//----------------------------------------------------------------
function open_form(form_view, referrer, id, panel,table_id){
	var template_url = jQuery('#template_url').val();
	$.get(template_url+ "admin/admins/refresh_content/"+form_view +'/'+ id, function(form_content){
		if(panel == '' || panel == null){
			jQuery('#branches_panel').find('.panel-body').html(form_content);
		}
		else{
			jQuery('#'+panel).find('.panel-body').html(form_content);
			if(referrer == 'view_employee'){
				jQuery('#'+panel).find('.ref_content').val(referrer);
				jQuery('#'+panel).find('.panel_id').val(panel);
			}else{
				jQuery('#'+panel).find('.ref_content').val(panel);
			}
			if(!(table_id == '' || table_id == null)){
				jQuery('#'+panel).find('.ref_table_id').val(table_id);
			}
		}
		// TO SHOW DATETIMEPICKER
		datepicker();
		jQuery("#indirect_supervisor").select2({placeholder: 'None'});
		
	});
}

/* FUNCTION SHOW ADD EMPLOYEE FORM */
//------------------------------------------------------------------
jQuery(document).on('change','.branch_select', function(){
	var branch_id     = $(this).val();
	if(branch_id == ''){
		jQuery('.hidden_wrapper').hide();
	}else{
		jQuery('.hidden_wrapper').show();
	}
			
});

/* FUNCTION SHOW ADD EMPLOYEE FORM */
//-----------------------------------------------------------------
jQuery(document).on('change','.company_select', function(){
	var company_id	= $(this).val();
	if(company_id == ''){
		jQuery('.branch_select_box').hide();
		jQuery('.employee_select_box').hide();
		jQuery('.hidden_wrapper').hide();
	}else{
		jQuery('.branch_select_box').show();
	}		
});

/* FUNCTION TO ACTIVATE EMPLOYEE */
//-------------------------------------------------------------------------
function activate_emp(table_name, activate_action, ref_content,table_id){
	var template_url = jQuery('#template_url').val();
	Lobibox.confirm({
		msg: "Are you sure, Activate this employee ?",
		callback: function ($this, type) {
			if (type === 'yes') {	
				$.ajax({
					type     	: 'post',
					url      	: template_url+activate_action,
					data     	: {table_name:table_name},
					dataType 	: 'json',
					beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
							},
					success  	: function(response){
						if(response.success){
							$.get(template_url+ "admin/employee/refresh_content/employee_listing", function(loan_type_list){ 
								$(".content #employee_listing").html(loan_type_list);	
								refresh_data_table('emp_datatable');
								//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'})
								$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
									source: function( request, response ) {
										$.ajax({
											url: template_url+'admin/employee/search_username/',
											dataType: "json",
											data: request,
											success: function(data){
												if(data.response == 'true') {
												   response(data.message);
												}
											}
										});
									}
								});
							});
							
							$.get(template_url+ "admin/company_loan/refresh_content/terminated_emp_panel", function(loan_type_list){ 
								$(".content #terminated_emp_panel").html(loan_type_list);	
								refresh_data_table('terminate_datatable');
								//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'})
								$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
									source: function( request, response ) {
										$.ajax({
											url		: template_url+'admin/employee/search_username/',
											dataType: "json",
											data	: request,
											success	: function(data){
												if(data.response == 'true') {
												   response(data.message);
												}
											}
										});
									}
								});
							});
							
							$.get(template_url+ "admin/company_loan/refresh_content/withdraw_emp_panel", function(loan_type_list){ 
								$(".content #withdraw_emp_panel").html(loan_type_list);	
								refresh_data_table('withdraw_emp_datatable');
								//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'})
								$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
									source: function( request, response ) {
										$.ajax({
											url: template_url+'admin/employee/search_username/',
											dataType: "json",
											data: request,
											success: function(data){
												if(data.response == 'true') {
												   response(data.message);
												}
											}
										});
									}
								});
							});
							
							// TO SHOW SUCCESS MESSAGE
							Lobibox.notify('success', {
								sound: false,
								msg:"Employee Activate Successfully."
							});
						}else{
							// TO SHOW ERROR MESSAGE
							Lobibox.notify('error', {
								sound: false,
								msg:'Some technical error occurred.'
							});
						}
					},
					complete : function(){
						$('.tabel-responsive .overlay').hide();
					},
				});
			}
		}
	});
}

/* FUNCTION TO CLOSE FORM */
//-----------------------------------------------------------------
function close_form(This){
	var template_url = jQuery('#template_url').val();
	var ref_content  = jQuery(This).parents('.form_data').find('.ref_content').val();
	var content      = ref_content;
	var ref_url      = jQuery(This).parents('.form_data').find('.ref_url').val();
	var table_id     = jQuery(This).parents('.form_data').find('.ref_table_id').val();
	var edit_id      = jQuery(This).parents('.form_data').find('.edit_id').val();
	var panel_id     = jQuery(This).parents('.form_data').find('.panel_id').val();
	
	if(!(edit_id == null || edit_id == '')){
		ref_content = ref_content +'/'+ edit_id;
	}
	
	$('.tabel-responsive .overlay').show();
	$.get(template_url+ ref_url + ref_content, function(html_view){ 
		if(content == 'view_employee'){
			$(".content #"+panel_id).find('.panel-body').html(html_view);
			scrollSmoothToTop();
		}else{
			$(".content #"+content).html(html_view);		
			refresh_data_table(table_id);
		}
		//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'})
		$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
			  source: function( request, response ) {
				$.ajax({
					url		: template_url+'admin/employee/search_username/',
					dataType: "json",
					data	: request,
					success	: function(data){
						if(data.response == 'true') {
						   response(data.message);
						}
					}
				});
			}
		});
		$('.tabel-responsive .overlay').hide();
	});
}

/* FUNCTION LOAD TRAVEL EDIT FORM WITHOUT REFRESH */
//---------------------------------------------------------------
function open_travel_form(form_view, title, id,section,content){
	var template_url = jQuery('#template_url').val();
	
	$.get(template_url+ "admin/employee/refresh_content/"+form_view +'/'+ id, function(form_content){ 
		jQuery('#add_travel_administration').find('#employee_panel').html(form_content);
		jQuery('.data_section').val(section);
		jQuery('.ref_content').val(content);
		// TO SHOW DATETIMEPICKER
		datepicker();
	});
}

/* FUNCTION GET ID FOR VIEW TERMINATE EMPLOYEE */
//---------------------------------------------------------------
jQuery(document).on('click', '.view_terminate_emp_btn', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var dataid 		 = jQuery(this).attr('data-id');
	
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/employee/view_ter_employee/'+dataid,
		success  : function(response){
			//$('#edit_employee');
			$('.terminate_panel').html(response);
			jQuery(".status_select_country").select2({placeholder: 'None'});
		}
	});
});

/* FUNCTION SELECT BRANCH ON THE BASIS SELECT COMPANY */
//----------------------------------------------------------------
jQuery(document).on('change', '.select_branch', function(e){
	e.preventDefault();
	var template_url  = jQuery('#template_url').val();
    var selectedValue = $(this).val();
	
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/employee/select_admin/'+selectedValue,
		success  : function(response){
			jQuery('select.super_admin_branch_box').html(response);
		}
	});	
});

/* FUNCTION SELECT BRANCH ON THE BASIS SELECT COMPANY */
//-------------------------------------------------------------------
jQuery(document).on('change', '.doc_company_select', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
    var company 	 = jQuery(this).val();
	var branch_select	 = jQuery('.doc_branch_select').val();
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/document/doc_company_select',
		data     : {company_ids : company},
		dataType : 'json',
		success  : function(response){
			if(response.branch){
				jQuery('select.doc_branch_select').html(response.branch);
			}
			if(response.employee){
				jQuery('select.doc_emp_select').html(response.employee);
			}
		}
	});	
});

/* FUNCTION SELECT EMPLOYEE ON THE BASIS BRANCH SELECTION */
//-------------------------------------------------------------------
jQuery(document).on('change', '.emp_doc .doc_branch_select', function(e){
	e.preventDefault();
	var template_url	= jQuery('#template_url').val();
    var branch			= jQuery(this).val();
	var company			= jQuery(this).parent().siblings().children('.doc_company_select').val();
	
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/document/doc_branch_select',
		data     : {branch_ids : branch , company_ids : company},
		dataType : 'json',
		success  : function(response){
			if(response.employee){
				jQuery('select.doc_emp_select').html(response.employee);
			}
		}
	});	
});

/* EMPLOYEE TABS OPEN WITH AJAX */
//------------------------------------------------------------------
function tabs_open(This){
	var template_url = jQuery('#template_url').val();
	
	if(This != ''){
		var dataid 		 = jQuery(This).attr('data-id');
		var datatable 	 = jQuery(This).attr('data-table');
	}else{
		var dataid 		 = '' ;
		var datatable    = '' ;
	}	
	$('.emp_tabs').each(function () {
		var alldataid 	 = jQuery(this).attr('data-id');
		var alldatatable = jQuery(this).attr('data-table');
		
		if(dataid != alldataid && datatable !=  alldatatable){
			$.get(template_url+ "admin/admins/refresh_content/" + alldataid, function(response){ 
			$(".content #"+alldataid).html(response);
			refresh_data_table(alldatatable);
			//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
			jQuery(".select2_drop").select2({placeholder: 'None'});
			});
		}
	});
}

/* FUNCTION BACK EMPLOYEE VIEW PAGE */
//-----------------------------------------------------------------
function edit_close_form(This){
	var template_url = jQuery('#template_url').val();
	var ref_content  = jQuery(This).siblings('.ref_content').val();
	var ref_url      = jQuery(This).siblings('.ref_url').val();
	var table_id     = jQuery(This).siblings('.ref_table_id').val();
	var panel        = jQuery(This).siblings('.data_panel').val();
	$('.tabel-responsive .overlay').show();
	$.get(template_url+ ref_url +'/'+ref_content, function(branches_list){ 
		$("#"+panel).html(branches_list);	
		refresh_data_table(table_id);
		//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
		$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
			  source: function( request, response ) {
				$.ajax({
					url		: template_url+'admin/employee/search_username/',
					dataType: "json",
					data	: request,
					success	: function(data){
						if(data.response == 'true') {
						   response(data.message);
						}
					}
				});
			}
		});
		$('.tabel-responsive .overlay').hide();
	});
}

function back_to_travel(This){
	var template_url = jQuery('#template_url').val();
	var ref_content  = jQuery(This).siblings('.ref_content').val();
	var ref_url      = jQuery(This).siblings('.ref_url').val();
	var table_id     = jQuery(This).siblings('.ref_table_id').val();
	var panel        = jQuery(This).siblings('.data_panel').val();
	
	
	$('#employee_panel').show();
	$.get(template_url+ ref_url +'/'+ref_content, function(branches_list){ 
		$("#"+panel).html(branches_list);
		
		$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
			  source: function( request, response ) {
				$.ajax({
					url		: template_url+'admin/employee/search_username/',
					dataType: "json",
					data	: request,
					success	: function(data){
						if(data.response == 'true') {
						   response(data.message);
						}
					}
				});
			}
		});
		$('.tabel-responsive .overlay').hide();
	});
}

/* FUNCTION SUBMIT EDIT EMPLOYEE DATA */
//------------------------------------------------------------------
jQuery(document).on('submit', '.view_form_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_action  = jQuery(this).find('.form_action').val();
	var ref_content  = jQuery(this).find('.ref_content').val();
	var ref_url      = jQuery(this).find('.ref_url').val();
	var table_id     = jQuery(this).find('.ref_table_id').val();
	var panel        = jQuery(this).find('.data_panel').val();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+form_action,
		data     	: formData,
		contentType	: false,       // The content type used when sending data to the server.
		cache		: false,             // To unable request pages to be cached
		processData	:false,
		dataType 	: 'json',
		beforeSend 	: function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	: function(response){
			if(response.success){
				$.get(template_url+ ref_url +'/'+ref_content, function(branches_list){ 
				$("#"+panel).html(branches_list);	
				refresh_data_table(table_id);
				//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'})
				$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						  source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
				});
				jQuery('#management_popup').modal('hide');
				
				// TO SHOW SUCCESS MESSAGE
				Lobibox.notify('success', {
					sound: false,
					msg:response.success_msg
				});
			}else{
				if(response.error_msg != null){
					var error_msg = response.error_msg;
				}else{
					var error_msg = error_msg;
				}
	
				// TO SHOW ERROR MESSAGE
				Lobibox.notify('error', {
					sound: false,
					msg:error_msg
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION BACK TERMINATED EMPLOYEE VIEW PAGE */
//--------------------------------------------------------------
function terminate_close_form(This){
	var template_url = jQuery('#template_url').val();
	var ref_content  = jQuery(This).siblings('.ref_content').val();
	var ref_url      = jQuery(This).siblings('.ref_url').val();
	var table_id     = jQuery(This).siblings('.ref_table_id').val();
	
	$('.tabel-responsive .overlay').show();
	$.get(template_url+ ref_url , function(branches_list){ 
		$("#terminate_panel").html(branches_list);	
		//refresh_data_table(table_id);
		$('.tabel-responsive .overlay').hide();
	});
}

/* FUNCTION SUBMIT EDIT TERMINATE EMPLOYEE DATA */
//----------------------------------------------------------------
jQuery(document).on('submit', '.terminate_view_form_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_action  = jQuery(this).find('.form_action').val();
	var ref_content  = jQuery(this).find('.ref_content').val();
	var ref_url      = jQuery(this).find('.ref_url').val();
	var panel        = jQuery(this).find('.data_panel').val();
	var table_id     = jQuery(this).find('.ref_table_id').val();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+form_action,
		data     	: formData,
		contentType	: false,       // The content type used when sending data to the server.
		cache		: false,             // To unable request pages to be cached
		processData	:false,
		dataType 	: 'json',
		beforeSend 	: function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	: function(response){
			if(response.success){
				$.get(template_url+ ref_url +'/'+ref_content, function(branches_list){ 
				$("#"+panel).html(branches_list);	
				refresh_data_table(table_id);
				//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
				$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						  source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
				});
				jQuery('#management_popup').modal('hide');
				
				// TO SHOW SUCCESS MESSAGE
				Lobibox.notify('success', {
					sound: false,
					msg:response.success_msg
				});
			}else{
				if(response.error_msg != null){
					var error_msg = response.error_msg;
				}else{
					var error_msg = error_msg;
				}
				
				// TO SHOW ERROR MESSAGE
				Lobibox.notify('error', {
					sound: false,
					msg:error_msg
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION OPEN IMAGE BROWSER IN EMPLOYEE VIEW SECTION WITH TRIGGER CLICK */
//--------------------------------------------------------------------------
jQuery(document).ready(function(){
	 jQuery(document).on('click', '.image_load_icon', function(e){
		jQuery(".upload_btn .admin_image").trigger("click");
	});
});

/* FUNCTION DELETE VIEW IMAGE FROM EMPLOYEE SECTION */
//-----------------------------------------------------------------
jQuery(document).on('click', '.image_delete', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var dataid		 = jQuery(this).siblings('input[type="hidden"]').val();
	var This         = jQuery(this);
	Lobibox.confirm({
		msg: "Are you sure, Delete Employee Image ?",
		callback: function ($this, type) {
			if (type === 'yes') {		
				$.ajax({
					type     	: 'post',
					url      	: template_url+'admin/employee/image_view_delete/'+dataid,
					dataType 	: 'json',
					success  	: function(response){
						if(response.success){
							This.siblings('img.user_img').attr('src', template_url+ 'assets/images/avatar.png');
							This.remove();
							Lobibox.notify('success', {
								sound: false,
								msg:response.success_msg
							});
						}else{
							// TO SHOW ERROR MESSAGE
							Lobibox.notify('error', {
								sound: false,
								msg:'Some technical error occurred.'
							});
						}
					}
				});
			}
		}
	});
});

/* FUNCTION DELETE VIEW IMAGE FROM TERMINATE EMPLOYEE SECTION */
//---------------------------------------------------------------------
jQuery(document).on('click', '.termination_emp_image', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var dataid		 = jQuery(this).attr('data-id');
	Lobibox.confirm({
		msg: "Are you sure, Delete Employee Image ?",
		callback: function ($this, type) {
			if (type === 'yes') {	
				$.ajax({
					type     	: 'post',
					url      	: template_url+'admin/employee/image_view_delete/'+dataid,
					contentType	: false,       // The content type used when sending data to the server.
					cache		: false,             // To unable request pages to be cached
					processData	:false,
					dataType 	: 'json',
					success  	: function(response){
						if(response.success){
							$.get(template_url+ "admin/employee/edit_ter_image_refresh_content/"+dataid, function(loan_type_list){ 
								$("#terminate_panel").html(loan_type_list);	
								refresh_data_table('terminate_datatable');
							});
							Lobibox.notify('success', {
								sound: false,
								msg:response.success_msg
							});
						}else{
							if(response.error_msg != null){
								var error_msg = response.error_msg;
							}else{
								var error_msg = error_msg;
							}
							// TO SHOW ERROR MESSAGE
							Lobibox.notify('error', {
								sound: false,
								msg:error_msg
							});
						}
					}
				});
			}
		}
	});
});  

/* SHOW OTHER DOCUMENT FIELDS ON CHANGE OTHER */
//---------------------------------------------------------------
$(function() {
	jQuery(document).on('change', '.document_type', function(e){
		var other_form_data = jQuery('.other_form_data').html();
		if($(this).val() == 'others') {
			jQuery('.other_document').html(other_form_data);
			datepicker();
            jQuery('.other_document').show(); 
        } else {
			jQuery('.other_document').html('');
            jQuery('.other_document').hide(); 
        } 
    });
});

/* PRINT PERSON THOUGHTS ABOUT STUDENT */
//---------------------------------------------------------------
function printpage(target_url){
	jQuery.ajax({
		type	: "POST",
		url		: target_url, 
		async	: false,
		success	: function(result){
			// alert(result);
			jQuery(".employee_print").html(result);
			jQuery(".employee_print").printThis({
				pageTitle: 'title'
			});
		}
	});   
}

/* FUNCTION SHOW TERMINATE DATE DROPDOWN */
//------------------------------------------------------------------
jQuery(document).on('change','.employee_status', function(){
	var status = $(this).val();
	if(status == 'terminate'){
		jQuery('#terminate_date_dropdown').show();
	}else{
		jQuery('#terminate_date_dropdown').hide();
	}
});

/* FUNCTION SHOW WITHDRAW DATE DROPDOWN */
//------------------------------------------------------------------
jQuery(document).on('change','.employee_status', function(){
	var status = $(this).val();
	if(status == 'withdraw'){
		jQuery('#withdraw_date_dropdown').show();
	}else{
		jQuery('#withdraw_date_dropdown').hide();
	}
});

//FUNCTION OPEN POP UP FOR WITHDRAW EMPLOYEE
function withdraw_emp(form_view,modal_title,id){
	
	var template_url = jQuery('#template_url').val();
	Lobibox.confirm({
		msg		: "Are you sure, withdrawal this employee ?",
		callback: function ($this, type) {
			
			if (type === 'yes') {
				$.get(template_url+ "admin/employee/refresh_content/"+form_view +'/'+ id, function(form_content){ 
					jQuery('#management_popup').find('.modal-title').html(modal_title);
					jQuery('#management_popup').find('.modal-body').html(form_content);

					// TO SHOW DATETIMEPICKER
					datepicker();
					jQuery('#management_popup').modal('show');
				});
			}
		}
	});
}

/* FUNCTION WITHDRAW EMPLOYEE */
//----------------------------------------------------------
jQuery(document).on('submit', '.withdraw_form_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_action  = jQuery(this).find('.form_action').val();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	$.ajax({
		type         : 'post',
		url          : template_url+form_action,
		data         : formData,
		contentType  : false,       // The content type used when sending data to the server.
		cache        : false,             // To unable request pages to be cached
		processData  : false,
		dataType     : 'json',
		beforeSend 	 : function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	 : function(response){
			if(response.success){
				$.get(template_url+ "admin/employee/refresh_content/employee_listing", function(loan_type_list){ 
					$(".content #employee_listing").html(loan_type_list);	
					refresh_data_table('emp_datatable');
					//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
					$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						  source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
				});
				$.get(template_url+ "admin/company_loan/refresh_content/withdraw_emp_panel", function(loan_type_list){ 
					$(".content #withdraw_emp_panel").html(loan_type_list);	
					refresh_data_table('withdraw_emp_datatable');
					//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
					$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						  source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
				});
						
				jQuery('#management_popup').modal('hide');
				// TO SHOW SUCCESS MESSAGE
				Lobibox.notify('success', {
					sound: false,
					msg:'Employee Withdrawal Successfully'
				});
			}else{
				// TO SHOW ERROR MESSAGE
				Lobibox.notify('error', {
					sound: false,
					msg:'Some technical error occurred.'
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION TO TERMINATE EMPLOYEE */
//------------------------------------------------------------------------ 
jQuery(document).on('submit', '.terminate_form_data', function(e){
	e.preventDefault();
	var template_url  = jQuery('#template_url').val();
	var form_action   = jQuery(this).find('.form_action').val();
	var form          = jQuery(this)[0];
	var formData      = new FormData(form);
	
	$.ajax({
		type         : 'post',
		url          : template_url+form_action,
		data         : formData,
		contentType  : false,       // The content type used when sending data to the server.
		cache        : false,             // To unable request pages to be cached
		processData  : false,
		dataType     : 'json',
		beforeSend 	 : function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	 : function(response){
			if(response.success){
				$.get(template_url+ "admin/employee/refresh_content/employee_listing", function(html_view){ 
					$(".content #employee_listing").html(html_view);	
					refresh_data_table('emp_datatable');
					//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
					$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						  source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
				});
				$.get(template_url+ "admin/company_loan/refresh_content/terminated_emp_panel", function(loan_type_list){ 
					$(".content #terminated_emp_panel").html(loan_type_list);	
				
					refresh_data_table('terminate_datatable');
					//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
					$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						  source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
				});
				jQuery('#management_popup').modal('hide');
					// TO SHOW SUCCESS MESSAGE
					Lobibox.notify('success', {
						sound	: false,
						msg		: 'Employee Terminate Successfully.'
					});
			}else{
				// TO SHOW ERROR MESSAGE
				Lobibox.notify('error', {
					sound	: false,
					msg		: 'Some technical error occurred.'
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION SUBMIT EDIT WITHDRAW EMPLOYEE DATA */
//----------------------------------------------------------------
jQuery(document).on('submit', '.withdraw_view_form_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_action  = jQuery(this).find('.form_action').val();
	var ref_content  = jQuery(this).find('.ref_content').val();
	var ref_url      = jQuery(this).find('.ref_url').val();
	var panel        = jQuery(this).find('.data_panel').val();
	var table_id     = jQuery(this).find('.ref_table_id').val();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);

	$.ajax({
		type     	: 'post',
		url      	: template_url+form_action,
		data    	: formData,
		contentType	: false,       // The content type used when sending data to the server.
		cache		: false,             // To unable request pages to be cached
		processData	: false,
		dataType 	: 'json',
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			if(response.success){
				$.get(template_url+ ref_url +'/'+ref_content, function(branches_list){ 
				$("#"+panel).html(branches_list);	
				refresh_data_table(table_id);
				//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
				$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						  source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
				});
				jQuery('#management_popup').modal('hide');
				
				// TO SHOW SUCCESS MESSAGE
				Lobibox.notify('success', {
					sound: false,
					msg:response.success_msg
				});
			}else{
				if(response.error_msg != null){
					var error_msg = response.error_msg;
				}else{
					var error_msg = error_msg;
				}
	
				// TO SHOW ERROR MESSAGE
				Lobibox.notify('error', {
					sound: false,
					msg:error_msg
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});


/* FUNCTION DELETE VIEW IMAGE FROM WITHDRAW EMPLOYEE SECTION */
//---------------------------------------------------------------------
jQuery(document).on('click', '.withdraw_emp_image', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var dataid		 = jQuery(this).attr('data-id');
	Lobibox.confirm({
		msg: "Are you sure, Delete Employee Image ?",
		callback: function ($this, type) {
			if (type === 'yes') {	
				$.ajax({
					type     	: 'post',
					url      	: template_url+'admin/employee/image_view_delete/'+dataid,
					contentType	: false,       // The content type used when sending data to the server.
					cache		: false,             // To unable request pages to be cached
					processData	: false,
					dataType 	: 'json',
					success  	: function(response){
						if(response.success){
							$.get(template_url + "admin/employee/edit_withdraw_image_refresh_content/"+dataid, function(loan_type_list){ 
								$("#withdraw_emp_panel").html(loan_type_list);	
								refresh_data_table('withdraw_emp_datatable');
							});
							Lobibox.notify('success', {
								sound	: false,
								msg		: response.success_msg
							});
						}else{
							if(response.error_msg != null){
								var error_msg = response.error_msg;
							}else{
								var error_msg = error_msg;
							}
							// TO SHOW ERROR MESSAGE
							Lobibox.notify('error', {
								sound: false,
								msg  : error_msg
							});
						}
					}
				});
			}
		}
	});
});  

// FUNCTION FOR TOGGLE BUTTON
jQuery(document).ready(function(){
	// SEARCH FORM TOGGLE
	jQuery(document).on('click', '.search_form_filter', function(e){
		$(".search_form").slideToggle();
		datepicker();
	});
	
	jQuery(document).mouseup(function(e) {
		var container   = jQuery(".ui-tabs-nav");
	
		// if the target of the click isn't the container nor a descendant of the container
		if (!container.is(e.target) && container.has(e.target).length === 1 ) {
			jQuery('.search_form').slideUp();
		}
	});
	
	// CLOSE SEARCH FORM
	jQuery(document).on('click', '.search_form_close', function(e){
		$(".search_form").slideUp();
	});
});

// SEARCH DOCUMENT TYPE FORM FOR ADMIN
//---------------------------------------------------------------
jQuery(document).on('submit', '#search_doc_type', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var create_from  = jQuery('#create_from').val();
	var create_till  = jQuery('#create_till').val();
	
	// To show warning if both dates are empty
	if(create_from == '' && create_till == ''){
		Lobibox.alert('warning', {
			sound	: false,
			msg		: 'Please select dates to filter data.'
		});
		return;
	}
	// Checking for dates
	if(create_from <= create_till || create_till == ''){ 
		jQuery('.tabel-responsive .overlay').show();
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/document/search_document_type/',
			data     	: form_data,
			success  	: function(response){
				jQuery('.tabel-responsive .overlay').hide();
				if(response != "error"){
					$("#document_type .tabel-responsive").html(response);
					refresh_data_table('document_datatable');
					datepicker();
				}
			}
		});
	}else{
		Lobibox.alert('warning', {
			sound	: false,
			msg		: 'Create Till can\'t be less then Create From.'
		});
	}
});

// SEARCH BRANCH DOCUMENT FORM FOR ADMIN
//-------------------------------------------------------------------
jQuery(document).on('submit', '#search_branch_document', function(e){
	e.preventDefault();
	var template_url	= jQuery('#template_url').val();
	var form_data		= jQuery(this).serialize();
	var assign_from		= jQuery('#search_branch_document #assign_from').val();
	var assign_till		= jQuery('#search_branch_document #assign_till').val();
	
	if(assign_from <= assign_till || assign_till == ''){ 
		$('.tabel-responsive .overlay').show();
		$.ajax({
			type	: 'post',
			url		: template_url+'admin/document/search_branch_document/',
			data	: form_data,
			success	: function(response){
				$('.tabel-responsive .overlay').hide();
				if(response != "error"){
					$("#branch_documents .tabel-responsive").html(response);
					refresh_data_table('branch_doc_datatable');
					datepicker();
				}
			}
		});
	}
	else{
		Lobibox.alert('warning', {
			sound 	: false,
			msg 	: 'Assign Till can\'t be less then Assign From.'
		});
	}
});

// SEARCH EMPLOYEE DOCUMNET FORM FOR ADMIN
jQuery(document).on('submit', '#search_employee_document', function(e){
	e.preventDefault();
	var template_url 	 	= jQuery('#template_url').val();
	var form_data    	 	= jQuery(this).serialize();
	var assign_from 	 	= jQuery('#search_employee_document #assign_from').val();
	var assign_till 	 	= jQuery('#search_employee_document #assign_till').val();
	var doc_company_select 	= jQuery('.search_emp .doc_company_select').val();
	var doc_branch_select 	= jQuery('.search_emp .doc_branch_select').val();
	var doc_emp_select 		= jQuery('.search_emp .doc_emp_select').val();
	
	if(assign_from <= assign_till || assign_till == ''){ 
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/document/search_employee_document/',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				
				if(response != "error"){
					$("#employee_documents .tabel-responsive").html(response);
					refresh_data_table('emp_doc_datatable');
					datepicker();
					
					/*$.ajax({
						type     : 'post',
						url      : template_url+'admin/document/doc_company_select',
						data     : {company_ids : doc_company_select},
						
						dataType 	: 'json',
						success  : function(response){
							if(response.branch){
								
								jQuery('select.doc_branch_select').html(response.branch);
							}
							if(response.employee){
								jQuery('select.doc_emp_select').html(response.employee);
							}
						}
					});	
					
					jQuery('#search_employee_document #assign_from').val(assign_from);
					jQuery('#search_employee_document #assign_till').val(assign_till);
					jQuery('.search_emp .doc_company_select').val(doc_company_select);
					
					setTimeout(function(){ jQuery('.search_emp .doc_branch_select').val(doc_branch_select); }, 100);
					setTimeout(function(){ jQuery('.search_emp .doc_emp_select').val(doc_emp_select); }, 100);*/
				}
			},
			complete : function(){
				$('.tabel-responsive .overlay').hide();
			},
		});
	}else{
		Lobibox.alert('warning', {
			sound: false,
			msg:'Assign Till can\'t be less then Assign From.'
		});
	}
});

/*DOCUMENT TABS OPEN WITH AJAX */
//------------------------------------------------------------------
function doc_tabs(This){
	var template_url = jQuery('#template_url').val();
	var dataid 		 = jQuery(This).attr('data-id');
	var datatable 	 = jQuery(This).attr('data-table');
	$('.tabel-responsive .overlay').show();
	$.get(template_url+ "admin/admins/refresh_content/" + dataid, function(response){ 
		$(".content #"+dataid).html(response);	
		refresh_data_table(datatable);
		$('.tabel-responsive .overlay').hide();
	});
}

/* SLIDE TOGGLE FOR JOIN DATE */
//-----------------------------------------------------------------------
jQuery(document).on('change', '.check_date input', function(e){
	$(this).parents('.check_date').siblings(".date_wrap").slideToggle();
});

/* SEARCH EMPLOYEE FOR EMPLOYEE SECTION */
//-----------------------------------------------------------------
jQuery(document).on('submit', '#search_employee', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var emp_id 	     = jQuery('#search_employee #emp_id').val();
	var company 	 = jQuery('#search_employee .doc_company_select.company').val();
	var employee 	 = jQuery('#search_employee .doc_emp_select').val();
	var join_date    = jQuery('#search_employee #join_date').val();
	var branch 	     = jQuery('#search_employee .doc_branch_select').val();
	var from_date 	 = jQuery('#search_employee #from_date').val();
	var to_date 	 = jQuery('#search_employee #to_date').val();
	
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/employee/search_employee/',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				
				if(response != "error"){
					$("#employee_listing .panel-body").html(response);
					refresh_data_table('emp_datatable');
					datepicker();
					if(from_date != '' || to_date != ''){
						jQuery('#emp_date').attr('checked',true);
						jQuery('.date_wrap').show();
					}else{
						jQuery('#emp_date').attr('checked',false);
						jQuery('.date_wrap').hide();
					}
					jQuery('#search_employee #from_date').val(from_date);
					jQuery('#search_employee #to_date').val(to_date);
					jQuery('#search_employee #emp_id').val(emp_id);
					jQuery('#search_employee .doc_emp_select').val(employee);
					//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
					
					$( ".emp_id_text" ).autocomplete({

						source: function(request, response) {
							$.ajax({
							url		: template_url+'admin/employee/search/',
							data	: { term: $(".emp_id_text").val()},
							dataType: "json",
							type	: "POST",
							success	: function(data){
							   var resp = $.map(data,function(obj){
									return obj.emp_id;
								}); 
							   response(resp);
							}
						});
					},
					minLength: 1
					});
				}
			},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
	
	
});

/*  FUNCTION AUTO SUGGEST FOR EMPLOYEE ID */
//---------------------------------------------------------------------
$(document).ready( function() {
	var template_url = jQuery('#template_url').val();
		
		$( ".emp_id_text" ).autocomplete({
		source		: function(request, response) {
			$.ajax({
			url		: template_url+'admin/employee/search/',
			data	: { term: $(".emp_id_text").val()},
			dataType: "json",
			type	: "POST",
			success	: function(data){
			   var resp = $.map(data,function(obj){
					return obj.emp_id;
				}); 
			   response(resp);
			}
		});
	},
	minLength: 1
	});
});

// MULTI LIST FOR RECIEPT FILES
//---------------------------------------------------------------
jQuery(document).on('click', '.add_files', function(e){
	var wrapper			= $('.files_wrapper'); //Input field wrapper
	var template_url	= $('#template_url').val(); //Input
	var fieldHTML 		= '<div class="travel_reciept clearfix">\
								<label>\
									<div class="travel_file"><img class="" src=""></div>\
									<input class="travel_reciept_file" id="travel_reciept_file" name="travel_reciept[]" type="file" onchange="readURL(this);">\
									<a class="open_travel_reciept btn btn-primary">Upload</a>\
								</label>\
								<a href="javascript:void(0);" class="remove_button btn btn-primary color_red" title="Remove">Delete Reciept</a>\
							</div>'; //New input field html 
	$(wrapper).append(fieldHTML); // Add field html
});

jQuery(document).on('click', '.remove_button', function(e){ //Once remove button is clicked
	var reciept_id   = $(this).attr('data'); //Input
	var template_url = $(this).attr('base_url'); //Input
	var file_name 	 = $(this).attr('file_name'); //Input
	
	if(template_url != ""){
		$.ajax({
			type	: 'post',
			url		: template_url+'admin/employee/delete_trevel_reciept/'+reciept_id,
			data	: { file_name : file_name },
			success	: function(response){
			}
		});
	}
	e.preventDefault();
	$(this).parent('div').remove(); //Remove field html
});

jQuery(document).on('click', '.open_travel_reciept', function(e){ //Once remove button is clicked
    $(this).siblings('.travel_reciept_file').trigger('click');
});

// Back Button Form Travel Administration
jQuery(document).on('click', '.back_travel_admin', function(e){
	var template_url = jQuery('#template_url').val();
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+"admin/employee/back_travel_administration",
		beforeSend 	: function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	: function(response){
			jQuery('#management_popup').modal('hide');
			$(".content #add_travel_administration").html(response);	
		},
		complete 	: function(){
			$('.tabel-responsive .overlay').hide();
			refresh_data_table('travel_datatable');
		},
	});
});

// Back Button Form Staff Travel Administration
jQuery(document).on('click', '.staff_back_travel_admin', function(e){
	var template_url = jQuery('#template_url').val();
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+"staff/travel_administration/staff_back_travel_administration",
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
				jQuery('#management_popup').modal('hide');
				$(".content #add_travel_administration").html(response);	
		},
		complete 	: function(){
			$('.tabel-responsive .overlay').hide();
			refresh_data_table('travel_datatable');
		},
	});
});


// Add Button Form  Travel Administration
jQuery(document).on('click', '.add_travel_button', function(e){
	var template_url = jQuery('#template_url').val();
	$.ajax({
		type     	: 'post',
		url      	: template_url+"admin/employee/back_travel_administration",
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			jQuery('#management_popup').modal('hide');
			$(".content #add_travel_administration").html(response);	
			$('#employee_panel').hide();
			$('#add_employee').show();
		},
		complete 	: function(){
			$('.tabel-responsive .overlay').hide();
			refresh_data_table('travel_datatable');
			datepicker();
		},
	});
});

/* SEARCH FILTER FOR TERMINATED EMPLOYEE */
//---------------------------------------------------------------------------------
jQuery(document).on('submit', '#search_ter_employee', function(e){
	
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var emp_id 	     = jQuery('#search_ter_employee #emp_id').val();
	var company 	 = jQuery('#search_ter_employee .doc_company_select.company_ter').val();
	var employee 	 = jQuery('#search_ter_employee .doc_emp_select').val();
	var join_date    = jQuery('#search_ter_employee #join_date').val();
	var branch 	     = jQuery('#search_ter_employee .doc_branch_select.branch_ter').val();
	var from_date 	 = jQuery('#search_ter_employee input[name="from_date"]').val();
	var to_date 	 = jQuery('#search_ter_employee input[name="to_date"]').val();
		
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/employee/search_employee/terminate',
			data     	: form_data,
			beforeSend 	: function(){ $('.tabel-responsive .overlay').show(); },
			success  	: function(response){
				if(response != "error"){
					$("#terminate_panel .panel-body").html(response);
					refresh_data_table('terminate_datatable');
					datepicker();
					if(from_date != '' || to_date != ''){
						jQuery('#search_ter_employee #emp_date').attr('checked',true);
						jQuery('#search_ter_employee .date_wrap').show();
					}else{
						jQuery('#search_ter_employee #emp_date').attr('checked',false);
						jQuery('#search_ter_employee .date_wrap').hide();
					}					
					jQuery('#search_ter_employee input[name="from_date"]').val(from_date);
					jQuery('#search_ter_employee input[name="to_date"]').val(to_date);
					jQuery('#search_ter_employee #emp_id').val(emp_id);
					jQuery('#search_ter_employee .doc_emp_select').val(employee);
					
					$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						source: function( request, response ) {
							$.ajax({
								url: template_url+'admin/employee/search_username/',
								dataType: "json",
								data: request,
								success: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
					jQuery('.search_form input[type="checkbox"]').click(function(){
						if(jQuery(this).prop("checked") == true){
							jQuery('.search_form .form-control.doc_emp_select').val('all');
							jQuery(".search_form .form-control.doc_emp_select").attr("disabled",true);
							jQuery(".search_form .form-control.emp_id_text").attr("disabled",true);
						}
						else if(jQuery(this).prop("checked") == false){
							jQuery(".search_form .form-control.doc_emp_select").attr("disabled",false);
							jQuery(".search_form .form-control.emp_id_text").attr("disabled",false);
						}
					});
				}
			},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});	

/* SEARCH FILTER FOR WITHDRAWL EMPLOYEE */
//---------------------------------------------------------------------------------
jQuery(document).on('submit', '#search_withdrawl_employee', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var emp_id 	     = jQuery('#search_withdrawl_employee #emp_id').val();
	var employee 	 = jQuery('#search_withdrawl_employee .doc_emp_select').val();
	var join_date    = jQuery('#search_withdrawl_employee #join_date').val();
	var from_date 	 = jQuery('#search_withdrawl_employee input[name="from_date"]').val();
	var to_date 	 = jQuery('#search_withdrawl_employee input[name="to_date"]').val();
	
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/employee/search_employee/withdraw',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				if(response != "error"){
					$("#withdraw_emp_panel .panel-body").html(response);
					refresh_data_table('withdraw_emp_datatable');
					datepicker();
					
					if(from_date != '' || to_date != ''){
						jQuery('#search_withdrawl_employee #emp_date').attr('checked',true);
						jQuery('#search_withdrawl_employee .date_wrap').show();
					}else{
						jQuery('#search_withdrawl_employee #emp_date').attr('checked',false);
						jQuery('#search_withdrawl_employee .date_wrap').hide();
					}
					
					jQuery('#search_withdrawl_employee input[name="from_date"]').val(from_date);
					jQuery('#search_withdrawl_employee input[name="to_date"]').val(to_date);
					jQuery('#search_withdrawl_employee #emp_id').val(emp_id);
					jQuery('#search_withdrawl_employee .doc_emp_select').val(employee);
					
					$( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
						source: function( request, response ) {
							$.ajax({
								url		: template_url+'admin/employee/search_username/',
								dataType: "json",
								data	: request,
								success	: function(data){
									if(data.response == 'true') {
									   response(data.message);
									}
								}
							});
						}
					});
					jQuery('.search_form input[type="checkbox"]').click(function(){
						if(jQuery(this).prop("checked") == true){
							jQuery('.search_form .form-control.doc_emp_select').val('all');
							jQuery(".search_form .form-control.doc_emp_select").attr("disabled",true);
							jQuery(".search_form .form-control.emp_id_text").attr("disabled",true);
						}
						else if(jQuery(this).prop("checked") == false){
							jQuery(".search_form .form-control.doc_emp_select").attr("disabled",false);
							jQuery(".search_form .form-control.emp_id_text").attr("disabled",false);
						}
					});
				}
			},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});		

/* FUNCTION FOR SEARCH EMPLOYEE EMERGENCY CONTACT */
//-----------------------------------------------------------------
jQuery(document).on('submit', '#search_emp_emergency_contact', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var employee 	 = jQuery('#search_emp_emergency_contact .doc_emp_select').val();
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/employee/search_employee/emergency_contact',
		data     	: form_data,
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			if(response != "error"){
				$("#emp_emergency_contact").html(response);
				refresh_data_table('emergency_contact_datatable');
				datepicker();
				jQuery('#search_emp_emergency_contact .doc_emp_select').val(employee);
				//jQuery('#search_emp_emergency_contact .doc_emp_select').select2(employee);
			}
		},
		complete 	: function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION EMPLOYEE ID AUTO SUGGEST ON TABS CLICK */
//------------------------------------------------------------
 jQuery(document).on('click', '.emp_id_auto', function(e){
	  var template_url = jQuery('#template_url').val();
	  $( ".emp_id_text" ).autocomplete({ //the recipient text field with id #username
		  source: function( request, response ) {
			$.ajax({
				url		: template_url+'admin/employee/search_username/',
				dataType: "json",
				data	: request,
				success	: function(data){
					if(data.response == 'true') {
					   response(data.message);
					}
				}
			});
		}
    });
});

/* FUNCTION FOR SELECT2 FOR EMPLOYEE NAME */
//---------------------------------------------------------------------
$(this).ready( function (){
	//jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});
	jQuery(".select2_drop").select2({placeholder: 'None'});
});

/* FUNCTION ON CLICK PAGE REFRESH */
//--------------------------------------------------------------------------------
jQuery(document).on('click', '.emergency_contact_tab', function(e){
	var template_url = jQuery('#template_url').val();
	var dataid 		 = jQuery(this).attr('data-id');
	var datatable    = jQuery(this).attr('data-table');
	
		$('.tabel-responsive .overlay').show();
		$.get(template_url+ "admin/admins/refresh_content/" + dataid, function(response){ 
		$(".content #"+dataid).html(response);	
		refresh_data_table(datatable);
		$('.tabel-responsive .overlay').hide();
	});
});

/* FUNCTION TO TERMINATE EMPLOYEE */
//------------------------------------------------------------------------ 
jQuery(document).on('submit', '.terminate_admin_form_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_action  = jQuery(this).find('.form_action').val();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	
	$.ajax({
		type         : 'post',
		url          : template_url+form_action,
		data         : formData,
		contentType  : false,       // The content type used when sending data to the server.
		cache        : false,             // To unable request pages to be cached
		processData  : false,
		dataType     : 'json',
		beforeSend 	 : function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	 : function(response){
			if(response.success){
				$.get(template_url+ "admin/admins/refresh_content/admin_listing", function(loan_type_list){ 
					$(".content #admin_listing").html(loan_type_list);	
					refresh_data_table('admin_table');
				});
				
				$.get(template_url+ "admin/admins/refresh_content/terminated_admin_panel", function(loan_type_list){ 
					$(".content #terminated_admin_panel").html(loan_type_list);	
					refresh_data_table('terminate_admin_table');
				});
							
				jQuery('#management_popup').modal('hide');
				// TO SHOW SUCCESS MESSAGE
				Lobibox.notify('success', {
					sound: false,
					msg:'Admin Terminate Successfully.'
				});
			
			}else{
				// TO SHOW ERROR MESSAGE
				Lobibox.notify('error', {
					sound: false,
					msg:'Some technical error occurred.'
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION TO TERMINATE EMPLOYEE */
//------------------------------------------------------------------------ 
jQuery(document).on('submit', '.withdraw_admin_form_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_action  = jQuery(this).find('.form_action').val();
	var form         = jQuery(this)[0];
	var formData     = new FormData(form);
	
	$.ajax({
		type         : 'post',
		url          : template_url+form_action,
		data         : formData,
		contentType  : false,       // The content type used when sending data to the server.
		cache        : false,             // To unable request pages to be cached
		processData  : false,
		dataType     : 'json',
		beforeSend 	 : function(){
				$('.tabel-responsive .overlay').show();
				},
		success  	 : function(response){
			if(response.success){
				$.get(template_url+ "admin/admins/refresh_content/admin_listing", function(loan_type_list){ 
					$(".content #admin_listing").html(loan_type_list);	
					refresh_data_table('admin_table');
				});
				$.get(template_url+ "admin/admins/refresh_content/withdrawl_admin_panel", function(loan_type_list){ 
					$(".content #withdrawl_admin_panel").html(loan_type_list);	
					refresh_data_table('withdrawl_admin_datatable');
				});
							
				jQuery('#management_popup').modal('hide');
					// TO SHOW SUCCESS MESSAGE
					Lobibox.notify('success', {
						sound: false,
						msg:'Admin Withdrawal Successfully.'
					});
			}else{
				// TO SHOW ERROR MESSAGE
				Lobibox.notify('error', {
					sound: false,
					msg:'Some technical error occurred.'
				});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});


/* FUNCTION TO ACTIVATE ADMIN */
//-------------------------------------------------------------------------
function activate_admin(table_name, activate_action, ref_content,table_id){
	var template_url = jQuery('#template_url').val();
	Lobibox.confirm({
		msg: "Are you sure, Activate this admin ?",
		callback: function ($this, type) {
			if (type === 'yes') {	
				$.ajax({
					type     	: 'post',
					url      	: template_url+activate_action,
					data     	: {table_name:table_name},
					dataType 	: 'json',
					beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
							},
					success  	: function(response){
						if(response.success){
							$.get(template_url+ "admin/admins/refresh_content/admin_listing", function(loan_type_list){ 
								$(".content #admin_listing").html(loan_type_list);	
								refresh_data_table('admin_table');
							});
							$.get(template_url+ "admin/admins/refresh_content/terminated_admin_panel", function(loan_type_list){ 
								$(".content #terminated_admin_panel").html(loan_type_list);	
								refresh_data_table('terminate_admin_table');
							});
							$.get(template_url+ "admin/admins/refresh_content/withdrawl_admin_panel", function(loan_type_list){ 
								$(".content #withdrawl_admin_panel").html(loan_type_list);	
								refresh_data_table('withdrawl_admin_datatable');
							});
							
							// TO SHOW SUCCESS MESSAGE
							Lobibox.notify('success', {
								sound: false,
								msg  : "Admin Activate Successfully."
							});
						}else{
							// TO SHOW ERROR MESSAGE
							Lobibox.notify('error', {
								sound: false,
								msg  : 'Some technical error occurred.'
							});
						}
					},
					complete : function(){
						$('.tabel-responsive .overlay').hide();
					},
				});
			}
		}
	});
}

/* FUNCTION FOR SEARCH ADMINS */
//-----------------------------------------------------------------
jQuery(document).on('submit', '#search_admin', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var company 	 = jQuery('#search_admin .doc_company_select.company').val();
	var branch 	     = jQuery('#search_admin .doc_branch_select').val();
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/admins/search_admin',
		data     	: form_data,
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			
			if(response != "error"){
				$("#admin_listing .content_section").html(response);
				refresh_data_table('admin_table');
				$.ajax({
					type     : 'post',
					url      : template_url+'admin/document/doc_company_select',
					data     : {company_ids : company},
					dataType : 'json',
					success  : function(response){
						if(response.branch){
							jQuery('select.doc_branch_select').html(response.branch);
						}
						if(response.employee){
							jQuery('select.doc_emp_select').html(response.employee);
						}
					}
				});	
				datepicker();
				jQuery('#search_admin .doc_company_select.company').val(company);
				setTimeout(function(){ jQuery('#search_admin .doc_branch_select').val(branch); }, 100);
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION FOR SEARCH TERMINATE ADMINS */
//-----------------------------------------------------------------
jQuery(document).on('submit', '#search_terminate_admin', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var company 	 = jQuery('#search_terminate_admin .doc_company_select.company').val();
	var branch 	     = jQuery('#search_terminate_admin .doc_branch_select').val();
	
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/admins/search_admin/terminate',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				if(response != "error"){
					$("#terminated_admin_panel .content_section").html(response);
					refresh_data_table('terminate_admin_table');
					$.ajax({
						type     : 'post',
						url      : template_url+'admin/document/doc_company_select',
						data     : {company_ids : company},
						dataType : 'json',
						success  : function(response){
							if(response.branch){
								jQuery('select.doc_branch_select').html(response.branch);
							}
							if(response.employee){
								jQuery('select.doc_emp_select').html(response.employee);
							}
						}
					});	
					datepicker();
					jQuery('#search_terminate_admin .doc_company_select.company').val(company);
					setTimeout(function(){ jQuery('#search_terminate_admin .doc_branch_select').val(branch); }, 100);
				}
			},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION FOR SEARCH WITHDRAWL ADMINS */
//-----------------------------------------------------------------
jQuery(document).on('submit', '#search_withdrawl_admin', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var company 	 = jQuery('#search_withdrawl_admin .doc_company_select.company').val();
	var branch 	     = jQuery('#search_withdrawl_admin .doc_branch_select').val();
	
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/admins/search_admin/withdraw',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				
				if(response != "error"){
					$("#withdrawl_admin_panel .content_section").html(response);
					refresh_data_table('withdrawl_admin_datatable');
					$.ajax({
						type     : 'post',
						url      : template_url+'admin/document/doc_company_select',
						data     : {company_ids : company},
						dataType : 'json',
						success  : function(response){
							if(response.branch){
								jQuery('select.doc_branch_select').html(response.branch);
							}
							if(response.employee){
								jQuery('select.doc_emp_select').html(response.employee);
							}
						}
					});	
					datepicker();
					jQuery('#search_withdrawl_admin .doc_company_select.company').val(company);
					setTimeout(function(){ jQuery('#search_withdrawl_admin .doc_branch_select').val(branch); }, 100);
				}
			},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* FUNCTION FOR SEARCH EMERGENCY CONTACT */
//-----------------------------------------------------------------
jQuery(document).on('submit', '#search_admin_emergency_contact', function(e){
	
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var company 	 = jQuery('#search_admin_emergency_contact .doc_company_select.company').val();
	var branch 	     = jQuery('#search_admin_emergency_contact .doc_branch_select').val();
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/admins/search_admin/emergency_contact',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				if(response != "error"){
					$("#admin_emergency_contact .panel-body").html(response);
					refresh_data_table('admin_emergency_contact_datatabel');
					$.ajax({
						type     : 'post',
						url      : template_url+'admin/document/doc_company_select',
						data     : {company_ids : company},
						dataType : 'json',
						success  : function(response){
							if(response.branch){
								jQuery('select.doc_branch_select').html(response.branch);
							}
							if(response.employee){
								jQuery('select.doc_emp_select').html(response.employee);
							}
						}
					});	
					datepicker();
					jQuery('#search_admin_emergency_contact .doc_company_select.company').val(company);
					setTimeout(function(){ jQuery('#search_admin_emergency_contact .doc_branch_select').val(branch); }, 100);
				}
			},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

/* SEARCH FILTER FOR TRAVEL ADMINISTRATION */
//---------------------------------------------------------------------------------
jQuery(document).on('submit', '#search_travel_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var emp_name 	 = jQuery('#search_travel_data .doc_emp_select').val();
	var travel_type  = jQuery('#search_travel_data .travel_select.doc_travel_select').val();
	
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/employee/search_travel_data/',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				if(response != "error"){
					jQuery("#emp_travel_listing .panel-body").html(response);
					refresh_data_table('travel_datatable');
					jQuery('#emp_travel_listing .search_form').show();
					datepicker();
					setTimeout(function(){ jQuery('#search_travel_data .doc_emp_select').val(emp_name); }, 100);
					//setTimeout(function(){ jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});}, 100);
					jQuery('#search_travel_data .travel_select.doc_travel_select').val(travel_type);
				}
			},
		complete 		: function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});	

/* SEARCH FILTER FOR EMPLOYEE SKILLS */
//---------------------------------------------------------------------------------
jQuery(document).on('submit', '#search_employee_skills_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var emp_name 	 = jQuery('#search_employee_skills_data .emp_name').val();
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/employee/search_employee_skills_data/',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				if(response != "error"){
					$("#employee_skils").html(response);
					refresh_data_table('employee_skills_datatable');
					jQuery(".select2_drop").select2({placeholder: 'None'});
					$('input:radio[name=find_skills]').change(function () {
						if (this.value == 'employee') {
							$('#search_employee_skills_data .search_by_skills').css("display", "none");
							$('#search_employee_skills_data .search_by_employee').css("display", "inline-block");
						}
						else if (this.value == 'skills') {
							$('#search_employee_skills_data .search_by_employee').css("display", "none");
							$('#search_employee_skills_data .search_by_skills').css("display", "inline-block");
						}
					});
					datepicker();
					setTimeout(function(){ jQuery('#search_employee_skills_data .emp_name').val(emp_name); }, 100);
					//setTimeout(function(){ jQuery(".doc_emp_select.employee").select2({placeholder: 'None'});}, 100);
				}
			},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});	

/* TO TOGGLE SEARCH BY EMPLOYEE/SKILLS */
//--------------------------------------------------------------------------------------------
jQuery(document).on('change','input:radio[name=find_skills]',function () {
	if (this.value == 'employee'){
		$('#search_employee_skills_data .search_by_skills').css("display", "none");
		$('#search_employee_skills_data .search_by_employee').css("display", "inline-block");
	}
	else if (this.value == 'skills') {
		$('#search_employee_skills_data .search_by_employee').css("display", "none");
		$('#search_employee_skills_data .search_by_skills').css("display", "inline-block");
	}
});

/* FUNCTION LOAD CLIENT EDIT FORM WITHOUT REFRESH */
//---------------------------------------------------------------
function open_client_form(form_view, title, id,content){
	var template_url = jQuery('#template_url').val();
	
	$.get(template_url+ "admin/project_client/refresh_content/"+form_view +'/'+ id, function(form_content){ 
		jQuery('#client_panel').find('#add_client_panel').html(form_content);
		jQuery('.ref_content').val(content);
		// TO SHOW DATETIMEPICKER
		datepicker();
	});
}

/* SEARCH FILTER FOR CLIENTS */
//------------------------------------------------------------------------------
jQuery(document).on('submit', '#search_clients_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
		$.ajax({
			type     	: 'post',
			url      	: template_url+'admin/project_client/search_client_data/',
			data     	: form_data,
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
						},
			success  	: function(response){
				if(response != "error"){
					$("#add_client_panel .panel-body").html(response);
					refresh_data_table('client_datatable');
					jQuery(".select2_drop").select2({placeholder: 'None'});
					}
				},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});	

/* SEARCH FILTER FOR PROJECTS */
//--------------------------------------------------------------------------
jQuery(document).on('submit', '#search_project_data', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/project_client/search_project_data/',
		data     	: form_data,
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			if(response != "error"){
				$("#add_project_panel .panel-body").html(response);
				refresh_data_table('project_datatable');
				jQuery(".select2_drop").select2({placeholder: 'None'});
			}
		},
		complete 	: function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});	

/* SEARCH FILTER FOR ASSIGN PROJECTS */
//-----------------------------------------------------------------------
jQuery(document).on('submit', '#search_assign_project', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/project_client/search_assign_project/',
		data     	: form_data,
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			if(response != "error"){
				$("#add_assign_project_panel .panel-body").html(response);
				refresh_data_table('assigned_projects_datatable');
				jQuery(".select2_drop").select2({placeholder: 'None'});
			}
		},
		complete : function(){
			$('.tabel-responsive .overlay').hide();
		},
	});
});

// ANIMATE SCROLL IN FIXED HEIGHT DIVISION
//---------------------------------------------------------------
function scrollSmoothToTop() {
     $("html, body").animate({ scrollTop: 0 });
}	

jQuery(document).ready(function(){
	jQuery('.emp_birthday, .db_holidays, .db_events, .db_attendance, .db_news').slick({
		fade			: true,
		arrows			: true,
		draggable		: false,
		slidesToShow	: 1,
		Speed			: 300,
		slidesToScroll	: 1,
		infinite		: false,
		initialSlide	: ((new Date).getMonth())
	});
	
	jQuery('.bday_details_wrap, .hday_details_wrap, .events_details_wrap, .attendance_details_wrap').scrollbar();
	jQuery( ".sortable" ).sortable({
		cancel	: ".events_details_wrap, .hday_details_wrap , .bday_details_wrap, .attendance_details_wrap",
		//cancel: "not(.intro)",
		stop	: function( event, ui ) {
			var form_id = jQuery(ui.item).parents('form').attr('id');
			save_widget_order(form_id);
		}
	});
});

// FUNCTION TO SHOW ADD IN CALENDAR POPUP
//---------------------------------------------------------------------------
jQuery(document).on('click', '#calendar_view table tr.day td ', function(e){
	var container = jQuery('.holiday, .event');
	if( (!(jQuery(this).hasClass('other-month'))) && (!container.is(e.target))  ){
		var day   	= jQuery(this).clone().children().remove().end().text();
		var year  	= jQuery('#year').val();
		var month 	= jQuery('#month').val();
		var date 	= year +'-'+ month +'-'+ day;
		open_form_modal('add_in_cal','Add Holiday/Event','','','','',date);
	}
});

// FUNCTION TO CHANGE MONTH IN CALENDAR
//-----------------------------------------------------------
function change_month(This){
	$('.tabel-responsive .overlay').show();
	var url = jQuery(This).attr('name');
	$.get(url, function(content){ 
		jQuery('#calendar_view').html(content);
		$('.tabel-responsive .overlay').hide();
	});
}

// FUNCTION TO SEARCH FULL ATTENDANCE PAGE
//-------------------------------------------------------------------
jQuery(document).on('submit','#search_full_attendance',function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	
	jQuery.ajax({
		type 		: 'POST',
		url  		: template_url + "admin/attendance/search_attendance/full_attendance",
		data    	: form_data,
		beforeSend 	: function(){
			jQuery('#full_attendance .tabel-responsive .overlay').show();
		},
		success 	: function(response){
			jQuery('#full_attendance .tabel-responsive .overlay').hide();
			jQuery('#full_attendance .tabel-responsive').html(response);
			refresh_data_table('full_attendance_table');
		}
	});
});

jQuery(document).on('submit','#search_attendance_list',function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	
	jQuery.ajax({
		type 		: 'POST',
		url  		: template_url + "admin/attendance/search_attendance/attendance",
		data    	: form_data,
		beforeSend 	: function(){
			jQuery('#attendance_list .tabel-responsive .overlay').show();
		},
		success 	: function(response){
			jQuery('#attendance_list .tabel-responsive .overlay').hide();
			jQuery('#attendance_list .tabel-responsive').html(response);
			refresh_data_table('attendance_table');
		}
	});
});


// FUNCTION TO SAVE DASHBOARD WIDGET ORDER
function save_widget_order(form_id){
	var form_data 		= jQuery('#'+form_id).serialize();
	var template_url 	= jQuery('#template_url').val();
	jQuery.ajax({
		type 	: 'POST',
		url  	: template_url + 'admin/dashboard/save_widget_order',
		data    : form_data,
		success : function(response){
		}
	});
}

// FUNCTION FOR INBOX AND SENT MESSAGE TABBING SECTION
//-----------------------------------------------------------------
jQuery(document).on('click', '.tab_wrapper .btab-link',function(){
	var tab_id = jQuery(this).attr('data-tab');
	jQuery(this).siblings('.btab-link').removeClass('current');
	jQuery(this).parents('.tab_wrapper').siblings('.btab-content').removeClass('current');
	jQuery(this).addClass('current');
	jQuery("#"+tab_id).addClass('current');
});

// FUNCTION TO REDIRECT TO PAGE ACCORDING TO NOTIFICATION
//-----------------------------------------------------------------
jQuery(document).on('click', '.notif-direct', function(){
	var notif_type = jQuery(this).attr('data-notif-type');
});

// FUNCTION TO REMOVE LEAVE ATTACHMENT
jQuery(document).on('click','.attach_wrap .remove_btn',function(){
	if(confirm('Are you sure, want to remove attachment?')){
		jQuery(this).parent().siblings('input[type="file"]').val('');
		jQuery(this).parent().html('');
	}
});

// FUNCTION TO SHOW IMAGE
//------------------------------------------------------------
function show_attached(This){
	var template_url 	= jQuery('#template_url').val();
	var fileExtension 	= ['jpeg', 'jpg', 'png', 'gif'];
	if ($.inArray($(This).val().split('.').pop().toLowerCase(), fileExtension) == -1) {
		jQuery(This).siblings('.attached_preview').html('<img alt="Media" src="'+template_url+'assets/images/file-icon.png"><a href="javascript:void(0);" class="remove_btn"><i class="fa fa-times"></i></a>');
	}else{
		if (This.files && This.files[0]) {
			var readerObj 		= new FileReader();
			readerObj.onload 	= function (element) {
				jQuery(This).siblings('.attached_preview').html('<img alt="Media" src="'+element.target.result+'"><a href="javascript:void(0);" class="remove_btn"><i class="fa fa-times"></i></a>');
			}
			readerObj.readAsDataURL(This.files[0]);
		}	
	}
}

// FUNCTION TO SUBMIT DAILY REPORT FORM
//---------------------------------------------------------
jQuery(document).on('submit','#daily_report_form',function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var date_from    = jQuery('#date_from').val();
	var date_to      = jQuery('#date_to').val();
	if(date_from > date_to){
		alert('Starting date must be smaller than end date');
		return;
	}
	$('.tabel-responsive .overlay').show();
	jQuery.ajax({
		type 	: 'POST',
		url  	: template_url + 'admin/attendance/get_daily_report/'+date_from+'/'+date_to,
		success : function(response){
			$('.tabel-responsive .overlay').hide();
			jQuery('#daily_report').html(response);
			refresh_data_table('emp_datatable');
			datepicker();
		}
	});
});

// FUNCTION TO SHOW LEAVE TYPE BY EMPLOYEE ROLE
//----------------------------------------------
jQuery(document).on('click','.form-group #leave_role',function(){
	if(jQuery(this).is(":checked")){
		jQuery('.leave_emp_role').show();
	}else{
		jQuery('.leave_emp_role').hide();
		jQuery('.leave_emp_role').find('select').val('');
	}
});

// FUNCTION TO SHOW STATUS CHANGE NOTE SECTION 
//----------------------------------------------
jQuery(document).on('change','.form-group.leave_stats_blk .form-control',function () {
	
	if (this.value == 'Approved' || this.value == 'Rejected'){
		jQuery('.form-group.st_chng_note_blk').show();
	}else{
		jQuery('.form-group.st_chng_note_blk').hide();
	}
});


/* FUNCTION TO SHOW INDIRECT SUPERVISIOR  */
//----------------------------------------------------------------
jQuery(document).on('change', '.form-group.supervisor_block .form-control.status_select', function(){
	var template_url  	= jQuery('#template_url').val();
	var supervisor_id   = jQuery(this).val();
	var This          	= jQuery(this);
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/employee/get_indirect_emp/'+ supervisor_id,
		success  : function(response){
			jQuery('select.indirect_supervisor').html(response);
			jQuery("#indirect_supervisor").select2({placeholder: 'None'});
		}
	});
});

jQuery(document).ready(function(){
	jQuery("#search_emp_attendance").select2({placeholder: 'None'});
});

jQuery(document).on('click','.search_form.search_branches input[type="checkbox"]',function(){
	if(jQuery(this).prop("checked") == true){
		jQuery(this).parents('.search_form.search_branches').find('.form-control.doc_emp_select').val('all');
		jQuery(this).parents('.search_form.search_branches').find(".form-control.doc_emp_select").attr("disabled",true);
		jQuery(this).parents('.search_form.search_branches').find(".form-control.emp_id_text").attr("disabled",true);
	}
	else if(jQuery(this).prop("checked") == false){
		jQuery(this).parents('.search_form.search_branches').find(".form-control.doc_emp_select").attr("disabled",false);
		jQuery(this).parents('.search_form.search_branches').find(".form-control.emp_id_text").attr("disabled",false);
	}
});

//APPROVE TIMESHEET IN ADMIN AND SUPERVISOR
//--------------------------------------------------------------------------------------------------------
function approve_timesheet(id,action,typee){
	var template_url  	= jQuery('#template_url').val();
	var ref_url			= 'timesheet/refresh_content/';
	$.ajax({
			type     	: 'post',
			url      	: template_url+action+id+'/'+typee,
			dataType 	: 'json',
			beforeSend 	: function(){
							$('.tabel-responsive .overlay').show();
							},
			success  	: function(response){
				if(response.success){
					//jQuery('#management_popup').modal('hide');
					//jQuery(".select2_drop").select2({placeholder: 'None'});
					//jQuery("#ind_sup_select").select2({placeholder: 'None'});
						
					if(action == 'staff/emp_timesheet/edit_in_timesheet/'){
						$.get(ref_url + 'emp_pending_task/emp_pending_task', function(emp_pending_task){
							$(".content #emp_pending_task").html(emp_pending_task);
							refresh_data_table('wish_datatable');
						});
						$.get(ref_url + 'emp_approve_task/emp_approve_task', function(emp_approve_task){
							$(".content #emp_approve_task").html(emp_approve_task);
							refresh_data_table('jp_datatable');
						});
					}
					else{
						$.get(ref_url + 'admin_pending_task/admin_pending_task', function(admin_pending_task){
							$(".content #admin_pending_task").html(admin_pending_task);
							refresh_data_table('lt_datatable');
						});
						$.get(ref_url + 'admin_approve_task/admin_approve_task', function(admin_approve_task){
							$(".content #admin_approve_task").html(admin_approve_task);
							refresh_data_table('jp_datatable');
						});
					}	
				}	
			}
	});
}

//FILTER EMPLOYEE IN TIMESHEET SECTION
//-------------------------------------------------------------------------------------------------------
jQuery(document).on('submit', '#timesheet_employee', function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	var emp_id 	     = jQuery('#search_employee #emp_id').val();
	var company 	 = jQuery('#search_employee .doc_company_select.company').val();
	var employee 	 = jQuery('#search_employee .doc_emp_select').val();
	var join_date    = jQuery('#search_employee #join_date').val();
	var branch 	     = jQuery('#search_employee .doc_branch_select').val();
	var from_date 	 = jQuery('#search_employee #from_date').val();
	var to_date 	 = jQuery('#search_employee #to_date').val();
	var ref_url		 = 'timesheet/refresh_content/';
	
	$.ajax({
		type     	: 'post',
		url      	: template_url+'admin/timesheet/search_employee/',
		data     	: form_data,
		beforeSend 	: function(){
						$('.tabel-responsive .overlay').show();
					},
		success  	: function(response){
			$("#approve_task .panel-body").html(response);
				refresh_data_table('jp_datatable');
				refresh_data_table('holiday_datatable');
				datepicker();
			$('.tabel-responsive .overlay').hide();
	
		}				
	});
});

/* FUNCTION TO SHOW EMPLOYEE LISTING ACCORDING */
//------------------------------------------------------------------
/*jQuery(document).on('change', '#employee_salary', function(){
	var template_url  = jQuery('#template_url').val();
	var id            = jQuery(this).val();
	var This          = jQuery(this);
	
	//var user_id		  = jQuery(this).attr('data-id');
	$.ajax({
		type     : 'post',
		url      : template_url+'admin/employee/select_employee_salary/'+id,
		success  : function(response){
			This.parent().siblings('.employee_salary').html(response);
		}
	});
});*/

/* FUNCTION TO ADD APPRAISAL */
//------------------------------------------------------------------
jQuery(document).on('click', '.add_appraisal', function(){
	$(".employee_salary_").append("<div class='appraisal_wrap'>\
										<div class='add_appraisal_salary'>\
											<label>Salary <span class='required'>*</span></label>\
											<input type='number' id='emp_salary' class='form-control add_salary' name = 'salary[]' required>\
											<span class='slry_remove' title='Remove'><i class='fa fa-times fa_time' aria-hidden='true'></i></span>\
										</div>\
										<div  class='add_appraisal_date'>	\
											<label>Date <span class='required'>*</span></label>\
											<div class='input-group date doc_dpicker datepicker form_datepicker'>\
												<span class='input-group-addon'>\
												<span class='glyphicon glyphicon-calendar'></span></span>\
												<input type='text' id = 'emp_datee' class='form-control add_salary' name = 'date[]' required>\
											</div>\
										</div>\
										<input type='hidden' class='form_action' value='admin/employee_salary/add_appraisal'>\
										<input type='hidden' class='ref_content' value='employee_salary'>\
										<input type='hidden' class='ref_url' value='admin/employee/refresh_content/'>\
										<input type='hidden' class='ref_table_id' value='user_datatable'>\
									</div>\
								");
	datepicker();
	$('.hide_button').hide();
	$('#edit_cal').hide();
	$('.show_button').show();
});

jQuery(document).on('click', '.slry_remove', function(){
	$(this).parents(".appraisal_wrap").remove();
	
	if( !$.trim( $('.employee_salary_').html() ).length ){
		$(".show_button").hide();
		$('#edit_cal').show();
		$('.hide_button').show();
	} 
});

jQuery(document).on('click', '.select_emp', function(){
	$('.show_year').show();
})

jQuery(document).on('click', '.slc_year', function(){
	$('.show_month').show();
})

jQuery(document).on('click', '.slc_month', function(){
	$('.show_date').show();
	$('.drop_zone').show();
	$('.show_button').show();
})

jQuery(document).on('click', '.slc_year', function(){
	 var emp_id   = $('.emp_id').val();
	 var emp_year = $('#year').val();
	 //var cls_id   = $('#name').attr('title');
     
	 var template_url = jQuery('#template_url').val();
	$.ajax({
        type: "POST",
        url: template_url + "admin/employee_salary/slip_status/"+emp_id+'/'+emp_year,
        cache: false,
        success: function(response){
			var res    = response;
			var remove = res.substring(0, res.indexOf('null'));
			/*if(cls_id !==''){
				
				$('#month').html(remove);
			}*/
			$('.selected_month').html(remove);
		}
	 });
});


jQuery(document).on('click', '.slct_year', function(){
	 var emp_id     = $('#name').attr('title');
	 var emp_year   = $('#year').val();
	 var slct_id    = $('.selected_slip_id').val();
	 var slct_year  = $('.selected_slip_year').val();
	 var slct_month = $('.selected_slip_month').val();
	// var cls_id   = $('').attr('title');
     var template_url = jQuery('#template_url').val();
	
	$.ajax({
        type: "POST",
        url: template_url + "admin/employee_salary/edit_slipMonth/"+emp_id+'/'+emp_year+'/'+slct_year+'/'+slct_id +'/'+ slct_month,
        success: function(response){
			var res    = response;
			var remove = res.substring(0, res.indexOf('null'));
			$('.edit_month').html(remove);
		}
	 });
});

/*jQuery(document).on('click','#excel',function(e){
	e.preventDefault();
	var excel_link   = jQuery('.pdf_url').val();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery('.form_pdf_excel').serialize();
	
	jQuery.ajax({
		type 		: 'POST',
		url  		: excel_link,
		data    	: form_data,
		beforeSend 	: function(){
			//jQuery('#attendance_list .tabel-responsive .overlay').show();
		},
		success 	: function(response){
			
				jQuery('#content_pdf').html(response);
				/*$(".excel_table").table2excel({
					filename: "Table.xls"
					});*/
				
				/*$(".excel_table").tableExport({
					headers: true,
					footers: true,
					formats: [".xlsx"],
					fileName: "id", 
					bootstrap: false,
					exportButtons: true,
					position: "bottom", 
					ignoreRows: null,
					ignoreCols: null,
					trimWhitespace: false,
					RTL: false,
					sheetname: "id"
				});
				
				/*var myTable = $(".excel_table").tableExport({type:'excel',escape:'false'});
					
				myTable.update({
					fileName: "newFile"
				});
				autotable: false
				myTable.reset();
				myTable.remove();

				var exportData = myTable.getExportData();
				 jQuery('.hide_tabel_responsive ').hide();	
			}
			
					
		
					//jQuery('.for_attendance').html(response);
					//refresh_data_table('full_attendance_table');
					//refresh_data_table('attendance_table');
	});
});*/


jQuery(document).on('click','#pdf1',function(e){
	e.preventDefault();
	
	var lik          = jQuery('.pdf_url').val();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery('.form_pdf_excel').serialize();
	var month_val    = jQuery('#month').val();
	var date_from    = jQuery('#date_from').val();
	var date_to      = jQuery('#date_to').val();
	
	 	jQuery.ajax({
			type 		: 'POST',
			url  		: lik,
			data    	: form_data,
			beforeSend 	: function(){
				//jQuery('#attendance_list .tabel-responsive .overlay').show();
			},
			 success: function(response) {
				 	jQuery('#content_pdf').html(response);
					var id_data    = jQuery('#no_data_attendance').html();
				
					if( (id_data !== 'No data available in given range') ){
						var emp_name   = jQuery('.pdf_emp_name').html();
						var emp_period = jQuery('.pdf_emp_period').html();
						
						var remove     = emp_name.replace('Employee:-', '');
						var emp_remove = emp_period.replace('Period:-', '');
					}else{
						var remove     = 'nodata';
						var emp_remove = 'nodata';
					}
														
					var pdf = new jsPDF('p', 'pt', 'letter');
					source  = $('#content_pdf')[0];
					specialElementHandlers = {
					'#bypassme': function(element, renderer){
						return true
					}
				}
				margins = {
					top: 50,
					left: 60,
					width: 545
				  };
				pdf.fromHTML(
					source // HTML string or DOM elem ref.
					, margins.left // x coord
					, margins.top // y coord
					, {
						'width': margins.width // max width of content on PDF
						, 'elementHandlers': specialElementHandlers
					},
					function (dispose) {
						pdf.save(remove+'_'+emp_remove+'Attendance.pdf');
					}
				)
					    jQuery('.hide_tabel_responsive ').hide();
			}
		});
					
});

jQuery(document).on('change', '.check_month', function(){
	if($(".check_month[name='radio_button']:checked ").val()== 'month'){
		$('.show_month').show();
		$(".required_month").attr("required", true);
		$("#pdf11").attr("disabled", false)
		$("#excel").attr("disabled", false)
		$(".select_date").attr("required", false);
		$('.date_range').hide();
		$("#date_to").val("");
		$("#date_from").val("");
	}
		
	if($(".check_month[name='radio_button']:checked ").val()== 'range'){
		$('.date_range').show();
		$('.show_month').hide();
		$(".required_month").attr("required", false);
		$("#pdf11").attr("disabled", false)
		$("#excel").attr("disabled", false)
		$(".select_date").attr("required", true);
		$("#month").val("");
	}
});

jQuery(document).on('click', '.glyphicon ,.select_att_emp ', function(){
	$('#excel_button').attr("disabled", false);
});
 
 jQuery(document).on('submit','#attendance_list',function(e){
	e.preventDefault();
	var template_url = jQuery('#template_url').val();
	var form_data    = jQuery(this).serialize();
	
	jQuery.ajax({
		type 		: 'POST',
		url  		: template_url + "admin/employee_leaves/search_leaves/attendance",
		data    	: form_data,
		beforeSend 	: function(){
			jQuery('#attendance_list .tabel-responsive .overlay').show();
		},
		success 	: function(response){
			jQuery('#attendance_list .tabel-responsive .overlay').hide();
			jQuery('.leave_filter .tabel-responsive').html(response);
			refresh_data_table('user_datatable');
		}
	});
});