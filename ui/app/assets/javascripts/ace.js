/**
 <b>Ace custom scroller</b>. It is not as feature-rich as plugins such as NiceScroll but it's good enough for most cases.
*/
(function($ , undefined) {
	var Ace_Scroll = function(element , _settings) {
		var self = this;
		
		var attrib_values = ace.helper.getAttrSettings(element, $.fn.ace_scroll.defaults);
		var settings = $.extend({}, $.fn.ace_scroll.defaults, _settings, attrib_values);
	
		this.size = 0;
		this.lock = false;
		this.lock_anyway = false;
		
		this.$element = $(element);
		this.element = element;
		
		var vertical = true;

		var disabled = false;
		var active = false;
		var created = false;

		var $content_wrap = null, content_wrap = null;
		var $track = null, $bar = null, track = null, bar = null;
		var bar_style = null;
		
		var bar_size = 0, bar_pos = 0, bar_max_pos = 0, bar_size_2 = 0, move_bar = true;
		var reset_once = false;
		
		var styleClass = '';
		var trackFlip = false;//vertical on left or horizontal on top
		var trackSize = 0;

		var css_pos,
			css_size,
			max_css_size,
			client_size,
			scroll_direction,
			scroll_size;

		var ratio = 1;
		var inline_style = false;
		var mouse_track = false;
		var mouse_release_target = 'onmouseup' in window ? window : 'html';
		var dragEvent = settings.dragEvent || false;
		
		var trigger_scroll = _settings.scrollEvent || false;
		
		
		var detached = settings.detached || false;//when detached, hideOnIdle as well?
		var updatePos = settings.updatePos || false;//default is true
		
		var hideOnIdle = settings.hideOnIdle || false;
		var hideDelay = settings.hideDelay || 1500;
		var insideTrack = false;//used to hide scroll track when mouse is up and outside of track
		var observeContent = settings.observeContent || false;
		var prevContentSize = 0;
		
		var is_dirty = true;//to prevent consecutive 'reset' calls
		
		this.create = function(_settings) {
			if(created) return;
			//if(disabled) return;
			if(_settings) settings = $.extend({}, $.fn.ace_scroll.defaults, _settings);

			this.size = parseInt(this.$element.attr('data-size')) || settings.size || 200;
			vertical = !settings['horizontal'];

			css_pos = vertical ? 'top' : 'left';//'left' for horizontal
			css_size = vertical ? 'height' : 'width';//'width' for horizontal
			max_css_size = vertical ? 'maxHeight' : 'maxWidth';

			client_size = vertical ? 'clientHeight' : 'clientWidth';
			scroll_direction = vertical ? 'scrollTop' : 'scrollLeft';
			scroll_size = vertical ? 'scrollHeight' : 'scrollWidth';



			this.$element.addClass('ace-scroll');
			if(this.$element.css('position') == 'static') {
				inline_style = this.element.style.position;
				this.element.style.position = 'relative';
			} else inline_style = false;

			var scroll_bar = null;
			if(!detached) {
				this.$element.wrapInner('<div class="scroll-content" />');
				this.$element.prepend('<div class="scroll-track"><div class="scroll-bar"></div></div>');
			}
			else {
				scroll_bar = $('<div class="scroll-track scroll-detached"><div class="scroll-bar"></div></div>').appendTo('body');
			}


			$content_wrap = this.$element;
			if(!detached) $content_wrap = this.$element.find('.scroll-content').eq(0);
			
			if(!vertical) $content_wrap.wrapInner('<div />');
			
			content_wrap = $content_wrap.get(0);
			if(detached) {
				//set position for detached scrollbar
				$track = scroll_bar;
				setTrackPos();
			}
			else $track = this.$element.find('.scroll-track').eq(0);
			
			$bar = $track.find('.scroll-bar').eq(0);
			track = $track.get(0);
			bar = $bar.get(0);
			bar_style = bar.style;

			//add styling classes and horizontalness
			if(!vertical) $track.addClass('scroll-hz');
			if(settings.styleClass) {
				styleClass = settings.styleClass;
				$track.addClass(styleClass);
				trackFlip = !!styleClass.match(/scroll\-left|scroll\-top/);
			}
			
			//calculate size of track!
			if(trackSize == 0) {
				$track.show();
				getTrackSize();
			}
			
			$track.hide();
			

			//if(!touchDrag) {
			$track.on('mousedown', mouse_down_track);
			$bar.on('mousedown', mouse_down_bar);
			//}

			$content_wrap.on('scroll', function() {
				if(move_bar) {
					bar_pos = parseInt(Math.round(this[scroll_direction] * ratio));
					bar_style[css_pos] = bar_pos + 'px';
				}
				move_bar = false;
				if(trigger_scroll) this.$element.trigger('scroll', [content_wrap]);
			})


			if(settings.mouseWheel) {
				this.lock = settings.mouseWheelLock;
				this.lock_anyway = settings.lockAnyway;

				//mousewheel library available?
				this.$element.on(!!$.event.special.mousewheel ? 'mousewheel.ace_scroll' : 'mousewheel.ace_scroll DOMMouseScroll.ace_scroll', function(event) {
					if(disabled) return;
					checkContentChanges(true);

					if(!active) return !self.lock_anyway;

					if(mouse_track) {
						mouse_track = false;
						$('html').off('.ace_scroll')
						$(mouse_release_target).off('.ace_scroll');
						if(dragEvent) self.$element.trigger('drag.end');
					}
					

					event.deltaY = event.deltaY || 0;
					var delta = (event.deltaY > 0 || event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0) ? 1 : -1
					var scrollEnd = false//have we reached the end of scrolling?
					
					var clientSize = content_wrap[client_size], scrollAmount = content_wrap[scroll_direction];
					if( !self.lock ) {
						if(delta == -1)	scrollEnd = (content_wrap[scroll_size] <= scrollAmount + clientSize);
						else scrollEnd = (scrollAmount == 0);
					}

					self.move_bar(true);

					//var step = parseInt( Math.min(Math.max(parseInt(clientSize / 8) , 80) , self.size) ) + 1;
					var step = parseInt(clientSize / 8);
					if(step < 80) step = 80;
					if(step > self.size) step = self.size;
					step += 1;
					
					content_wrap[scroll_direction] = scrollAmount - (delta * step);


					return scrollEnd && !self.lock_anyway;
				})
			}
			
			
			//swipe not available yet
			var touchDrag = ace.vars['touch'] && 'ace_drag' in $.event.special && settings.touchDrag //&& !settings.touchSwipe;
			//add drag event for touch devices to scroll
			if(touchDrag/** || ($.fn.swipe && settings.touchSwipe)*/) {
				var dir = '', event_name = touchDrag ? 'ace_drag' : 'swipe';
				this.$element.on(event_name + '.ace_scroll', function(event) {
					if(disabled) {
						event.retval.cancel = true;
						return;
					}
					checkContentChanges(true);
					
					if(!active) {
						event.retval.cancel = this.lock_anyway;
						return;
					}

					dir = event.direction;
					if( (vertical && (dir == 'up' || dir == 'down'))
						||
						(!vertical && (dir == 'left' || dir == 'right'))
					   )
					{
						var distance = vertical ? event.dy : event.dx;

						if(distance != 0) {
							if(Math.abs(distance) > 20 && touchDrag) distance = distance * 2;

							self.move_bar(true);
							content_wrap[scroll_direction] = content_wrap[scroll_direction] + distance;
						}
					}
					
				})
			}
			
			
			/////////////////////////////////
			
			if(hideOnIdle) {
				$track.addClass('idle-hide');
			}
			if(observeContent) {
				$track.on('mouseenter.ace_scroll', function() {
					insideTrack = true;
					checkContentChanges(false);
				}).on('mouseleave.ace_scroll', function() {
					insideTrack = false;
					if(mouse_track == false) hideScrollbars();
				});
			}


			
			//some mobile browsers don't have mouseenter
			this.$element.on('mouseenter.ace_scroll touchstart.ace_scroll', function(e) {
				//if(ace.vars['old_ie']) return;//IE8 has a problem triggering event two times and strangely wrong values for this.size especially in fullscreen widget!
				
				is_dirty = true;
				if(observeContent) checkContentChanges(true);
				else if(settings.hoverReset) self.reset(true);
				
				$track.addClass('scroll-hover');
			}).on('mouseleave.ace_scroll touchend.ace_scroll', function() {
				$track.removeClass('scroll-hover');
			});
			//

			if(!vertical) $content_wrap.children(0).css(css_size, this.size);//the extra wrapper
			$content_wrap.css(max_css_size , this.size);
			
			disabled = false;
			created = true;
		}
		this.is_active = function() {
			return active;
		}
		this.is_enabled = function() {
			return !disabled;
		}
		this.move_bar = function($move) {
			move_bar = $move;
		}
		
		this.get_track = function() {
			return track;
		}

		this.reset = function(innert_call) {
			if(disabled) return;// this;
			if(!created) this.create();
			/////////////////////
			var size = this.size;
			
			if(innert_call && !is_dirty) {
				return;
			}
			is_dirty = false;

			if(detached) {
				var border_size = parseInt(Math.round( (parseInt($content_wrap.css('border-top-width')) + parseInt($content_wrap.css('border-bottom-width'))) / 2.5 ));//(2.5 from trial?!)
				size -= border_size;//only if detached
			}
	
			var content_size   = vertical ? content_wrap[scroll_size] : size;
			if( (vertical && content_size == 0) || (!vertical && this.element.scrollWidth == 0) ) {
				//element is hidden
				//this.$element.addClass('scroll-hidden');
				$track.removeClass('scroll-active')
				return;// this;
			}

			var available_space = vertical ? size : content_wrap.clientWidth;

			if(!vertical) $content_wrap.children(0).css(css_size, size);//the extra wrapper
			$content_wrap.css(max_css_size , this.size);
			

			if(content_size > available_space) {
				active = true;
				$track.css(css_size, available_space).show();

				ratio = parseFloat((available_space / content_size).toFixed(5))
				
				bar_size = parseInt(Math.round(available_space * ratio));
				bar_size_2 = parseInt(Math.round(bar_size / 2));

				bar_max_pos = available_space - bar_size;
				bar_pos = parseInt(Math.round(content_wrap[scroll_direction] * ratio));

				bar_style[css_size] = bar_size + 'px';
				bar_style[css_pos] = bar_pos + 'px';
				
				$track.addClass('scroll-active');
				
				if(trackSize == 0) {
					getTrackSize();
				}

				if(!reset_once) {
					//this.$element.removeClass('scroll-hidden');
					if(settings.reset) {
						//reset scrollbar to zero position at first							
						content_wrap[scroll_direction] = 0;
						bar_style[css_pos] = 0;
					}
					reset_once = true;
				}
				
				if(detached) setTrackPos();
			} else {
				active = false;
				$track.hide();
				$track.removeClass('scroll-active');
				$content_wrap.css(max_css_size , '');
			}

			return;// this;
		}
		this.disable = function() {
			content_wrap[scroll_direction] = 0;
			bar_style[css_pos] = 0;

			disabled = true;
			active = false;
			$track.hide();
			
			this.$element.addClass('scroll-disabled');
			
			$track.removeClass('scroll-active');
			$content_wrap.css(max_css_size , '');
		}
		this.enable = function() {
			disabled = false;
			this.$element.removeClass('scroll-disabled');
		}
		this.destroy = function() {
			active = false;
			disabled = false;
			created = false;
			
			this.$element.removeClass('ace-scroll scroll-disabled scroll-active');
			this.$element.off('.ace_scroll')

			if(!detached) {
				if(!vertical) {
					//remove the extra wrapping div
					$content_wrap.find('> div').children().unwrap();
				}
				$content_wrap.children().unwrap();
				$content_wrap.remove();
			}
			
			$track.remove();
			
			if(inline_style !== false) this.element.style.position = inline_style;
			
			if(idleTimer != null) {
				clearTimeout(idleTimer);
				idleTimer = null;
			}
		}
		this.modify = function(_settings) {
			if(_settings) settings = $.extend({}, settings, _settings);
			
			this.destroy();
			this.create();
			is_dirty = true;
			this.reset(true);
		}
		this.update = function(_settings) {
			if(_settings) settings = $.extend({}, settings, _settings);
		
			this.size = _settings.size || this.size;
			
			this.lock = _settings.mouseWheelLock || this.lock;
			this.lock_anyway = _settings.lockAnyway || this.lock_anyway;
			
			if(_settings.styleClass != undefined) {
				if(styleClass) $track.removeClass(styleClass);
				styleClass = _settings.styleClass;
				if(styleClass) $track.addClass(styleClass);
				trackFlip = !!styleClass.match(/scroll\-left|scroll\-top/);
			}
		}
		
		this.start = function() {
			content_wrap[scroll_direction] = 0;
		}
		this.end = function() {
			content_wrap[scroll_direction] = content_wrap[scroll_size];
		}
		
		this.hide = function() {
			$track.hide();
		}
		this.show = function() {
			$track.show();
		}

		
		this.update_scroll = function() {
			move_bar = false;
			bar_style[css_pos] = bar_pos + 'px';
			content_wrap[scroll_direction] = parseInt(Math.round(bar_pos / ratio));
		}

		function mouse_down_track(e) {
			e.preventDefault();
			e.stopPropagation();
				
			var track_offset = $track.offset();
			var track_pos = track_offset[css_pos];//top for vertical, left for horizontal
			var mouse_pos = vertical ? e.pageY : e.pageX;
			
			if(mouse_pos > track_pos + bar_pos) {
				bar_pos = mouse_pos - track_pos - bar_size + bar_size_2;
				if(bar_pos > bar_max_pos) {						
					bar_pos = bar_max_pos;
				}
			}
			else {
				bar_pos = mouse_pos - track_pos - bar_size_2;
				if(bar_pos < 0) bar_pos = 0;
			}

			self.update_scroll()
		}

		var mouse_pos1 = -1, mouse_pos2 = -1;
		function mouse_down_bar(e) {
			e.preventDefault();
			e.stopPropagation();

			if(vertical) {
				mouse_pos2 = mouse_pos1 = e.pageY;
			} else {
				mouse_pos2 = mouse_pos1 = e.pageX;
			}

			mouse_track = true;
			$('html').off('mousemove.ace_scroll').on('mousemove.ace_scroll', mouse_move_bar)
			$(mouse_release_target).off('mouseup.ace_scroll').on('mouseup.ace_scroll', mouse_up_bar);
			
			$track.addClass('active');
			if(dragEvent) self.$element.trigger('drag.start');
		}
		function mouse_move_bar(e) {
			e.preventDefault();
			e.stopPropagation();

			if(vertical) {
				mouse_pos2 = e.pageY;
			} else {
				mouse_pos2 = e.pageX;
			}
			

			if(mouse_pos2 - mouse_pos1 + bar_pos > bar_max_pos) {
				mouse_pos2 = mouse_pos1 + bar_max_pos - bar_pos;
			} else if(mouse_pos2 - mouse_pos1 + bar_pos < 0) {
				mouse_pos2 = mouse_pos1 - bar_pos;
			}
			bar_pos = bar_pos + (mouse_pos2 - mouse_pos1);

			mouse_pos1 = mouse_pos2;

			if(bar_pos < 0) {
				bar_pos = 0;
			}
			else if(bar_pos > bar_max_pos) {
				bar_pos = bar_max_pos;
			}
			
			self.update_scroll()
		}
		function mouse_up_bar(e) {
			e.preventDefault();
			e.stopPropagation();
			
			mouse_track = false;
			$('html').off('.ace_scroll')
			$(mouse_release_target).off('.ace_scroll');

			$track.removeClass('active');
			if(dragEvent) self.$element.trigger('drag.end');
			
			if(active && hideOnIdle && !insideTrack) hideScrollbars();
		}
		
		
		var idleTimer = null;
		var prevCheckTime = 0;
		function checkContentChanges(hideSoon) {
			//check if content size has been modified since last time?
			//and with at least 1s delay
			var newCheck = +new Date();
			if(observeContent && newCheck - prevCheckTime > 1000) {
				var newSize = content_wrap[scroll_size];
				if(prevContentSize != newSize) {
					prevContentSize = newSize;
					is_dirty = true;
					self.reset(true);
				}
				prevCheckTime = newCheck;
			}
			
			//show scrollbars when not idle anymore i.e. triggered by mousewheel, dragging, etc
			if(active && hideOnIdle) {
				if(idleTimer != null) {
					clearTimeout(idleTimer);
					idleTimer = null;
				}
				$track.addClass('not-idle');
			
				if(!insideTrack && hideSoon == true) {
					//hideSoon is false when mouse enters track
					hideScrollbars();
				}
			}
		}

		function hideScrollbars() {
			if(idleTimer != null) {
				clearTimeout(idleTimer);
				idleTimer = null;
			}
			idleTimer = setTimeout(function() {
				idleTimer = null;
				$track.removeClass('not-idle');
			} , hideDelay);
		}
		
		//for detached scrollbars
		function getTrackSize() {
			$track.css('visibility', 'hidden').addClass('scroll-hover');
			if(vertical) trackSize = parseInt($track.outerWidth()) || 0;
			 else trackSize = parseInt($track.outerHeight()) || 0;
			$track.css('visibility', '').removeClass('scroll-hover');
		}
		this.track_size = function() {
			if(trackSize == 0) getTrackSize();
			return trackSize;
		}
		
		//for detached scrollbars
		function setTrackPos() {
			if(updatePos === false) return;
		
			var off = $content_wrap.offset();//because we want it relative to parent not document
			var left = off.left;
			var top = off.top;

			if(vertical) {
				if(!trackFlip) {
					left += ($content_wrap.outerWidth() - trackSize)
				}
			}
			else {
				if(!trackFlip) {
					top += ($content_wrap.outerHeight() - trackSize)
				}
			}
			
			if(updatePos === true) $track.css({top: parseInt(top), left: parseInt(left)});
			else if(updatePos === 'left') $track.css('left', parseInt(left));
			else if(updatePos === 'top') $track.css('top', parseInt(top));
		}
		


		this.create();
		is_dirty = true;
		this.reset(true);
		prevContentSize = content_wrap[scroll_size];

		return this;
	}

	
	$.fn.ace_scroll = function (option,value) {
		var retval;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_scroll');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_scroll', (data = new Ace_Scroll(this, options)));
			 //else if(typeof options == 'object') data['modify'](options);
			if (typeof option === 'string') retval = data[option](value);
		});

		return (retval === undefined) ? $set : retval;
	};


	$.fn.ace_scroll.defaults = {
		'size' : 200,
		'horizontal': false,
		'mouseWheel': true,
		'mouseWheelLock': false,
		'lockAnyway': false,
		'styleClass' : false,
		
		'observeContent': false,
		'hideOnIdle': false,
		'hideDelay': 1500,
		
		'hoverReset': true //reset scrollbar sizes on mouse hover because of possible sizing changes
		,
		'reset': false //true= set scrollTop = 0
		,
		'dragEvent': false
		,
		'touchDrag': true
		,
		'touchSwipe': false
		,
		'scrollEvent': false //trigger scroll event

		,
		'detached': false
		,
		'updatePos': true
		/**
		,		
		'track' : true,
		'show' : false,
		'dark': false,
		'alwaysVisible': false,
		'margin': false,
		'thin': false,
		'position': 'right'
		*/
     }

	/**
	$(document).on('ace.settings.ace_scroll', function(e, name) {
		if(name == 'sidebar_collapsed') $('.ace-scroll').scroller('reset');
	});
	$(window).on('resize.ace_scroll', function() {
		$('.ace-scroll').scroller('reset');
	});
	*/

})(window.jQuery);

/**
 <b>Custom color picker element</b>. Converts html select elements to a dropdown color picker.
*/
(function($ , undefined) {
	var Ace_Colorpicker = function(element, _options) {

		var attrib_values = ace.helper.getAttrSettings(element, $.fn.ace_colorpicker.defaults);
		var options = $.extend({}, $.fn.ace_colorpicker.defaults, _options, attrib_values);


		var $element = $(element);
		var color_list = '';
		var color_selected = '';
		var selection = null;
		var color_array = [];
		
		$element.addClass('hide').find('option').each(function() {
			var $class = 'colorpick-btn';
			var color = this.value.replace(/[^\w\s,#\(\)\.]/g, '');
			if(this.value != color) this.value = color;
			if(this.selected) {
				$class += ' selected';
				color_selected = color;
			}
			color_array.push(color)
			color_list += '<li><a class="'+$class+'" href="#" style="background-color:'+color+';" data-color="'+color+'"></a></li>';
		}).
		end()
		.on('change.color', function(){
			$element.next().find('.btn-colorpicker').css('background-color', this.value);
		})
		.after('<div class="dropdown dropdown-colorpicker">\
		<a data-toggle="dropdown" class="dropdown-toggle" '+(options.auto_pos ? 'data-position="auto"' : '')+' href="#"><span class="btn-colorpicker" style="background-color:'+color_selected+'"></span></a><ul class="dropdown-menu'+(options.caret? ' dropdown-caret' : '')+(options.pull_right ? ' dropdown-menu-right' : '')+'">'+color_list+'</ul></div>')

		
		var dropdown = $element.next().find('.dropdown-menu')
		dropdown.on(ace.click_event, function(e) {
			var a = $(e.target);
			if(!a.is('.colorpick-btn')) return false;

			if(selection) selection.removeClass('selected');
			selection = a;
			selection.addClass('selected');
			var color = selection.data('color');

			$element.val(color).trigger('change');

			e.preventDefault();
			return true;//to hide dropdown
		})
		selection = $element.next().find('a.selected');

		this.pick = function(index, insert) {
			if(typeof index === 'number') {
				if(index >= color_array.length) return;
				element.selectedIndex = index;
				dropdown.find('a:eq('+index+')').trigger(ace.click_event);
			}
			else if(typeof index === 'string') {
				var color = index.replace(/[^\w\s,#\(\)\.]/g, '');
				index = color_array.indexOf(color);
				//add this color if it doesn't exist
				if(index == -1 && insert === true) {
					color_array.push(color);
					
					$('<option />')
					.appendTo($element)
					.val(color);
					
					$('<li><a class="colorpick-btn" href="#"></a></li>')
					.appendTo(dropdown)
					.find('a')
					.css('background-color', color)
					.data('color', color);
					
					index = color_array.length - 1;
				}
				if(index == -1) return;
				dropdown.find('a:eq('+index+')').trigger(ace.click_event);
			}
		}

		this.destroy = function() {
			$element.removeClass('hide').off('change.color')
			.next().remove();
			color_array = [];
		}
	}


	$.fn.ace_colorpicker = function(option, value) {
		var retval;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_colorpicker');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_colorpicker', (data = new Ace_Colorpicker(this, options)));
			if (typeof option === 'string') retval = data[option](value);
		});

		return (retval === undefined) ? $set : retval;
	}
	
	$.fn.ace_colorpicker.defaults = {
		'pull_right' : false,
		'caret': true,
		'auto_pos': true
	}
	
})(window.jQuery);

/**
 <b>Ace file input element</b>. Custom, simple file input element to style browser's default file input.
*/
(function($ , undefined) {
	var multiplible = 'multiple' in document.createElement('INPUT');
	var hasFileList = 'FileList' in window;//file list enabled in modern browsers
	var hasFileReader = 'FileReader' in window;
	var hasFile = 'File' in window;

	var Ace_File_Input = function(element , settings) {
		var self = this;
		
		var attrib_values = ace.helper.getAttrSettings(element, $.fn.ace_file_input.defaults);
		this.settings = $.extend({}, $.fn.ace_file_input.defaults, settings, attrib_values);

		this.$element = $(element);
		this.element = element;
		this.disabled = false;
		this.can_reset = true;
		

		this.$element
		.off('change.ace_inner_call')
		.on('change.ace_inner_call', function(e , ace_inner_call){
			if(self.disabled) return;
		
			if(ace_inner_call === true) return;//this change event is called from above drop event and extra checkings are taken care of there
			return handle_on_change.call(self);
			//if(ret === false) e.preventDefault();
		});

		var parent_label = this.$element.closest('label').css({'display':'block'})
		var tagName = parent_label.length == 0 ? 'label' : 'span';//if not inside a "LABEL" tag, use "LABEL" tag, otherwise use "SPAN"
		this.$element.wrap('<'+tagName+' class="ace-file-input" />');

		this.apply_settings();
		this.reset_input_field();//for firefox as it keeps selected file after refresh
	}
	Ace_File_Input.error = {
		'FILE_LOAD_FAILED' : 1,
		'IMAGE_LOAD_FAILED' : 2,
		'THUMBNAIL_FAILED' : 3
	};


	Ace_File_Input.prototype.apply_settings = function() {
		var self = this;

		this.multi = this.$element.attr('multiple') && multiplible;
		this.well_style = this.settings.style == 'well';

		if(this.well_style) this.$element.parent().addClass('ace-file-multiple');
		 else this.$element.parent().removeClass('ace-file-multiple');


		this.$element.parent().find(':not(input[type=file])').remove();//remove all except our input, good for when changing settings
		this.$element.after('<span class="ace-file-container" data-title="'+this.settings.btn_choose+'"><span class="ace-file-name" data-title="'+this.settings.no_file+'">'+(this.settings.no_icon ? '<i class="'+ ace.vars['icon'] + this.settings.no_icon+'"></i>' : '')+'</span></span>');
		this.$label = this.$element.next();
		this.$container = this.$element.closest('.ace-file-input');

		var remove_btn = !!this.settings.icon_remove;
		if(remove_btn) {
			var btn = 
			$('<a class="remove" href="#"><i class="'+ ace.vars['icon'] + this.settings.icon_remove+'"></i></a>')
			.appendTo(this.$element.parent());

			btn.on(ace.click_event, function(e){
				e.preventDefault();
				if( !self.can_reset ) return false;
				
				var ret = true;
				if(self.settings.before_remove) ret = self.settings.before_remove.call(self.element);
				if(!ret) return false;

				var r = self.reset_input();
				return false;
			});
		}


		if(this.settings.droppable && hasFileList) {
			enable_drop_functionality.call(this);
		}
	}

	Ace_File_Input.prototype.show_file_list = function($files , inner_call) {
		var files = typeof $files === "undefined" ? this.$element.data('ace_input_files') : $files;
		if(!files || files.length == 0) return;
		
		//////////////////////////////////////////////////////////////////
		
		if(this.well_style) {
			this.$label.find('.ace-file-name').remove();
			if(!this.settings.btn_change) this.$label.addClass('hide-placeholder');
		}
		this.$label.attr('data-title', this.settings.btn_change).addClass('selected');
		
		for (var i = 0; i < files.length; i++) {
			var filename = '', format = false;
			if(typeof files[i] === "string") filename = files[i];
			else if(hasFile && files[i] instanceof File) filename = $.trim( files[i].name );
			else if(files[i] instanceof Object && files[i].hasOwnProperty('name')) {
				//format & name specified by user (pre-displaying name, etc)
				filename = files[i].name;
				if(files[i].hasOwnProperty('type')) format = files[i].type;
				if(!files[i].hasOwnProperty('path')) files[i].path = files[i].name;
			}
			else continue;
			
			var index = filename.lastIndexOf("\\") + 1;
			if(index == 0)index = filename.lastIndexOf("/") + 1;
			filename = filename.substr(index);
			
			if(format == false) {
				if((/\.(jpe?g|png|gif|svg|bmp|tiff?)$/i).test(filename)) {				
					format = 'image';
				}
				else if((/\.(mpe?g|flv|mov|avi|swf|mp4|mkv|webm|wmv|3gp)$/i).test(filename)) {
					format = 'video';
				}
				else if((/\.(mp3|ogg|wav|wma|amr|aac)$/i).test(filename)) {
					format = 'audio';
				}
				else format = 'file';
			}
			
			var fileIcons = {
				'file' : 'fa fa-file',
				'image' : 'fa fa-picture-o file-image',
				'video' : 'fa fa-film file-video',
				'audio' : 'fa fa-music file-audio'
			};
			var fileIcon = fileIcons[format];
			
			
			if(!this.well_style) this.$label.find('.ace-file-name').attr({'data-title':filename}).find(ace.vars['.icon']).attr('class', ace.vars['icon'] + fileIcon);
			else {
				this.$label.append('<span class="ace-file-name" data-title="'+filename+'"><i class="'+ ace.vars['icon'] + fileIcon+'"></i></span>');
				var type = (inner_call === true && hasFile && files[i] instanceof File) ? $.trim(files[i].type) : '';
				var can_preview = hasFileReader && this.settings.thumbnail 
						&&
						( (type.length > 0 && type.match('image')) || (type.length == 0 && format == 'image') )//the second one is for older Android's default browser which gives an empty text for file.type
				if(can_preview) {
					var self = this;
					$.when(preview_image.call(this, files[i])).fail(function(result){
						//called on failure to load preview
						if(self.settings.preview_error) self.settings.preview_error.call(self, filename, result.code);
					})
				}
			}
		}
		
		return true;
	}
	
	Ace_File_Input.prototype.reset_input = function() {
	    this.reset_input_ui();
		this.reset_input_field();
	}
	
	Ace_File_Input.prototype.reset_input_ui = function() {
		 this.$label.attr({'data-title':this.settings.btn_choose, 'class':'ace-file-container'})
			.find('.ace-file-name:first').attr({'data-title':this.settings.no_file , 'class':'ace-file-name'})
			.find(ace.vars['.icon']).attr('class', ace.vars['icon'] + this.settings.no_icon)
			.prev('img').remove();
			if(!this.settings.no_icon) this.$label.find(ace.vars['.icon']).remove();
		
		this.$label.find('.ace-file-name').not(':first').remove();
		
		this.reset_input_data();
		
		//if(ace.vars['old_ie']) ace.helper.redraw(this.$container[0]);
	}
	Ace_File_Input.prototype.reset_input_field = function() {
		//http://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery/13351234#13351234
		this.$element.wrap('<form>').parent().get(0).reset();
		this.$element.unwrap();
		
		//strangely when reset is called on this temporary inner form
		//only **IE9/10** trigger 'reset' on the outer form as well
		//and as we have mentioned to reset input on outer form reset
		//it causes infinite recusrsion by coming back to reset_input_field
		//thus calling reset again and again and again
		//so because when "reset" button of outer form is hit, file input is automatically reset
		//we just reset_input_ui to avoid recursion
	}
	Ace_File_Input.prototype.reset_input_data = function() {
		if(this.$element.data('ace_input_files')) {
			this.$element.removeData('ace_input_files');
			this.$element.removeData('ace_input_method');
		}
	}

	Ace_File_Input.prototype.enable_reset = function(can_reset) {
		this.can_reset = can_reset;
	}

	Ace_File_Input.prototype.disable = function() {
		this.disabled = true;
		this.$element.attr('disabled', 'disabled').addClass('disabled');
	}
	Ace_File_Input.prototype.enable = function() {
		this.disabled = false;
		this.$element.removeAttr('disabled').removeClass('disabled');
	}

	Ace_File_Input.prototype.files = function() {
		return $(this).data('ace_input_files') || null;
	}
	Ace_File_Input.prototype.method = function() {
		return $(this).data('ace_input_method') || '';
	}
	
	Ace_File_Input.prototype.update_settings = function(new_settings) {
		this.settings = $.extend({}, this.settings, new_settings);
		this.apply_settings();
	}
	
	Ace_File_Input.prototype.loading = function(is_loading) {
		if(is_loading === false) {
			this.$container.find('.ace-file-overlay').remove();
			this.element.removeAttribute('readonly');
		}
		else {
			var inside = typeof is_loading === 'string' ? is_loading : '<i class="overlay-content fa fa-spin fa-spinner orange2 fa-2x"></i>';
			var loader = this.$container.find('.ace-file-overlay');
			if(loader.length == 0) {
				loader = $('<div class="ace-file-overlay"></div>').appendTo(this.$container);
				loader.on('click tap', function(e) {
					e.stopImmediatePropagation();
					e.preventDefault();
					return false;
				});
				
				this.element.setAttribute('readonly' , 'true');//for IE
			}
			loader.empty().append(inside);
		}
	}



	var enable_drop_functionality = function() {
		var self = this;
		
		var dropbox = this.$element.parent();
		dropbox
		.off('dragenter')
		.on('dragenter', function(e){
			e.preventDefault();
			e.stopPropagation();
		})
		.off('dragover')
		.on('dragover', function(e){
			e.preventDefault();
			e.stopPropagation();
		})
		.off('drop')
		.on('drop', function(e){
			e.preventDefault();
			e.stopPropagation();

			if(self.disabled) return;
		
			var dt = e.originalEvent.dataTransfer;
			var file_list = dt.files;
			if(!self.multi && file_list.length > 1) {//single file upload, but dragged multiple files
				var tmpfiles = [];
				tmpfiles.push(file_list[0]);
				file_list = tmpfiles;//keep only first file
			}
			
			
			file_list = processFiles.call(self, file_list, true);//true means files have been selected, not dropped
			if(file_list === false) return false;

			self.$element.data('ace_input_method', 'drop');
			self.$element.data('ace_input_files', file_list);//save files data to be used later by user

			self.show_file_list(file_list , true);
			
			self.$element.triggerHandler('change' , [true]);//true means ace_inner_call
			return true;
		});
	}
	
	
	var handle_on_change = function() {
		var file_list = this.element.files || [this.element.value];/** make it an array */
		
		file_list = processFiles.call(this, file_list, false);//false means files have been selected, not dropped
		if(file_list === false) return false;
		
		this.$element.data('ace_input_method', 'select');
		this.$element.data('ace_input_files', file_list);
		
		this.show_file_list(file_list , true);
		
		return true;
	}



	var preview_image = function(file) {
		var self = this;
		var $span = self.$label.find('.ace-file-name:last');//it should be out of onload, otherwise all onloads may target the same span because of delays
		
		var deferred = new $.Deferred;
		
		var getImage = function(src) {
			$span.prepend("<img class='middle' style='display:none;' />");
			var img = $span.find('img:last').get(0);
		
			$(img).one('load', function() {
				imgLoaded.call(null, img);
			}).one('error', function() {
				imgFailed.call(null, img);
			});

			img.src = src;
		}
		var imgLoaded = function(img) {
			//if image loaded successfully
			var size = 50;
			if(self.settings.thumbnail == 'large') size = 150;
			else if(self.settings.thumbnail == 'fit') size = $span.width();
			$span.addClass(size > 50 ? 'large' : '');

			var thumb = get_thumbnail(img, size/**, file.type*/);
			if(thumb == null) {
				//if making thumbnail fails
				$(this).remove();
				deferred.reject({code:Ace_File_Input.error['THUMBNAIL_FAILED']});
				return;
			}

			var w = thumb.w, h = thumb.h;
			if(self.settings.thumbnail == 'small') {w=h=size;};
			$(img).css({'background-image':'url('+thumb.src+')' , width:w, height:h})
					.data('thumb', thumb.src)
					.attr({src:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg=='})
					.show()

			///////////////////
			deferred.resolve();
		}
		var imgFailed = function(img) {
			//for example when a file has image extenstion, but format is something else
			$span.find('img').remove();
			deferred.reject({code:Ace_File_Input.error['IMAGE_LOAD_FAILED']});
		}
		
		if(hasFile && file instanceof File) {
			var reader = new FileReader();
			reader.onload = function (e) {
				getImage(e.target.result);
			}
			reader.onerror = function (e) {
				deferred.reject({code:Ace_File_Input.error['FILE_LOAD_FAILED']});
			}
			reader.readAsDataURL(file);
		}
		else {
			if(file instanceof Object && file.hasOwnProperty('path')) {
				getImage(file.path);//file is a file name (path) --- this is used to pre-show user-selected image
			}
		}
		
		return deferred.promise();
	}

	var get_thumbnail = function(img, size, type) {
		var w = img.width, h = img.height;
		
		//**IE10** is not giving correct width using img.width so we use $(img).width()
		w = w > 0 ? w : $(img).width()
		h = h > 0 ? h : $(img).height()

		if(w > size || h > size) {
		  if(w > h) {
			h = parseInt(size/w * h);
			w = size;
		  } else {
			w = parseInt(size/h * w);
			h = size;
		  }
		}


		var dataURL
		try {
			var canvas = document.createElement('canvas');
			canvas.width = w; canvas.height = h;
			var context = canvas.getContext('2d');
			context.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
			dataURL = canvas.toDataURL(/*type == 'image/jpeg' ? type : 'image/png', 10*/)
		} catch(e) {
			dataURL = null;
		}
		if(! dataURL) return null;
		

		//there was only one image that failed in firefox completely randomly! so let's double check things
		if( !( /^data\:image\/(png|jpe?g|gif);base64,[0-9A-Za-z\+\/\=]+$/.test(dataURL)) ) dataURL = null;
		if(! dataURL) return null;
		

		return {src: dataURL, w:w, h:h};
	}
	

	
	var processFiles = function(file_list, dropped) {
		var ret = checkFileList.call(this, file_list, dropped);
		if(ret === -1) {
			this.reset_input();
			return false;
		}
		if( !ret || ret.length == 0 ) {
			if( !this.$element.data('ace_input_files') ) this.reset_input();
			//if nothing selected before, reset because of the newly unacceptable (ret=false||length=0) selection
			//otherwise leave the previous selection intact?!!!
			return false;
		}
		if (ret instanceof Array || (hasFileList && ret instanceof FileList)) file_list = ret;
		
		
		ret = true;
		if(this.settings.before_change) ret = this.settings.before_change.call(this.element, file_list, dropped);
		if(ret === -1) {
			this.reset_input();
			return false;
		}
		if(!ret || ret.length == 0) {
			if( !this.$element.data('ace_input_files') ) this.reset_input();
			return false;
		}
		
		//inside before_change you can return a modified File Array as result
		if (ret instanceof Array || (hasFileList && ret instanceof FileList)) file_list = ret;
		
		return file_list;
	}
	
	
	var getExtRegex = function(ext) {
		if(!ext) return null;
		if(typeof ext === 'string') ext = [ext];
		if(ext.length == 0) return null;
		return new RegExp("\.(?:"+ext.join('|')+")$", "i");
	}
	var getMimeRegex = function(mime) {
		if(!mime) return null;
		if(typeof mime === 'string') mime = [mime];
		if(mime.length == 0) return null;
		return new RegExp("^(?:"+mime.join('|').replace(/\//g, "\\/")+")$", "i");
	}
	var checkFileList = function(files, dropped) {
		var allowExt   = getExtRegex(this.settings.allowExt);

		var denyExt    = getExtRegex(this.settings.denyExt);
		
		var allowMime  = getMimeRegex(this.settings.allowMime);

		var denyMime   = getMimeRegex(this.settings.denyMime);

		var maxSize    = this.settings.maxSize || false;
		
		if( !(allowExt || denyExt || allowMime || denyMime || maxSize) ) return true;//no checking required


		var safe_files = [];
		var error_list = {}
		for(var f = 0; f < files.length; f++) {
			var file = files[f];
			
			//file is either a string(file name) or a File object
			var filename = !hasFile ? file : file.name;
			if( allowExt && !allowExt.test(filename) ) {
				//extension not matching whitelist, so drop it
				if(!('ext' in error_list)) error_list['ext'] = [];
				 error_list['ext'].push(filename);
				
				continue;
			} else if( denyExt && denyExt.test(filename) ) {
				//extension is matching blacklist, so drop it
				if(!('ext' in error_list)) error_list['ext'] = [];
				 error_list['ext'].push(filename);
				
				continue;
			}

			var type;
			if( !hasFile ) {
				//in browsers that don't support FileReader API
				safe_files.push(file);
				continue;
			}
			else if((type = $.trim(file.type)).length > 0) {
				//there is a mimetype for file so let's check against are rules
				if( allowMime && !allowMime.test(type) ) {
					//mimeType is not matching whitelist, so drop it
					if(!('mime' in error_list)) error_list['mime'] = [];
					 error_list['mime'].push(filename);
					continue;
				}
				else if( denyMime && denyMime.test(type) ) {
					//mimeType is matching blacklist, so drop it
					if(!('mime' in error_list)) error_list['mime'] = [];
					 error_list['mime'].push(filename);
					continue;
				}
			}

			if( maxSize && file.size > maxSize ) {
				//file size is not acceptable
				if(!('size' in error_list)) error_list['size'] = [];
				 error_list['size'].push(filename);
				continue;
			}

			safe_files.push(file)
		}
		
	
		
		if(safe_files.length == files.length) return files;//return original file list if all are valid

		/////////
		var error_count = {'ext': 0, 'mime': 0, 'size': 0}
		if( 'ext' in error_list ) error_count['ext'] = error_list['ext'].length;
		if( 'mime' in error_list ) error_count['mime'] = error_list['mime'].length;
		if( 'size' in error_list ) error_count['size'] = error_list['size'].length;
		
		var event
		this.$element.trigger(
			event = new $.Event('file.error.ace'), 
			{
				'file_count': files.length,
				'invalid_count' : files.length - safe_files.length,
				'error_list' : error_list,
				'error_count' : error_count,
				'dropped': dropped
			}
		);
		if ( event.isDefaultPrevented() ) return -1;//it will reset input
		//////////

		return safe_files;//return safe_files
	}



	///////////////////////////////////////////
	$.fn.aceFileInput = $.fn.ace_file_input = function (option,value) {
		var retval;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_file_input');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_file_input', (data = new Ace_File_Input(this, options)));
			if (typeof option === 'string') retval = data[option](value);
		});

		return (retval === undefined) ? $set : retval;
	};


	$.fn.ace_file_input.defaults = {
		style: false,
		no_file: 'No File ...',
		no_icon: 'fa fa-upload',
		btn_choose: 'Choose',
		btn_change: 'Change',
		icon_remove: 'fa fa-times',
		droppable: false,
		thumbnail: false,//large, fit, small
		
		allowExt: null,
		denyExt: null,
		allowMime: null,
		denyMime: null,
		maxSize: false,
		
		//callbacks
		before_change: null,
		before_remove: null,
		preview_error: null
     }


})(window.jQuery);


/**
  <b>Bootstrap 2 typeahead plugin.</b> With Bootstrap <u>3</u> it's been dropped in favor of a more advanced separate plugin.
  Pretty good for simple cases such as autocomplete feature of the search box and required for <u class="text-danger">Tag input</u> plugin.
*/

/* =============================================================
 * bootstrap-typeahead.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function($){

  "use strict"; // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.bs_typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.source = this.options.source
    this.$menu = $(this.options.menu)
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function (item) {
      return item
    }

  , show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu
        .insertAfter(this.$element)
        .css({
          top: pos.top + pos.height
        , left: pos.left
        })
        .show()

      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var items

      this.query = this.$element.val()

      if (!this.query || this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this
      }

      items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

      return items ? this.process(items) : this
    }

  , process: function (items) {
      var that = this

      items = $.grep(items, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;')
        isSupported = typeof this.$element[eventName] === 'function'
      }
      return isSupported
    }

  , move: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
      this.move(e)
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return
      this.move(e)
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , focus: function (e) {
      this.focused = true
    }

  , blur: function (e) {
      this.focused = false
      if (!this.mousedover && this.shown) this.hide()
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
      this.$element.focus()
    }

  , mouseenter: function (e) {
      this.mousedover = true
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  , mouseleave: function (e) {
      this.mousedover = false
      if (!this.focused && this.shown) this.hide()
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.bs_typeahead

  $.fn.bs_typeahead = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('bs_typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('bs_typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.bs_typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  , minLength: 1
  }

  $.fn.bs_typeahead.Constructor = Typeahead


 /* TYPEAHEAD NO CONFLICT
  * =================== */

  $.fn.bs_typeahead.noConflict = function () {
    $.fn.bs_typeahead = old
    return this
  }


 /* TYPEAHEAD DATA-API
  * ================== */

  $(document).on('focus.bs_typeahead.data-api', '[data-provide="bs_typeahead"]', function (e) {
    var $this = $(this)
    if ($this.data('bs_typeahead')) return
    $this.bs_typeahead($this.data())
  })

}(window.jQuery);

/**
 <b>Wysiwyg</b>. A wrapper for Bootstrap wyswiwyg plugin.
 It's just a wrapper so you still need to include Bootstrap wysiwyg script first.
*/
(function($ , undefined) {
	$.fn.ace_wysiwyg = function($options , undefined) {
		var options = $.extend( {
			speech_button:true,
			wysiwyg:{}
        }, $options);

		var color_values = [
			'#ac725e','#d06b64','#f83a22','#fa573c','#ff7537','#ffad46',
			'#42d692','#16a765','#7bd148','#b3dc6c','#fbe983','#fad165',
			'#92e1c0','#9fe1e7','#9fc6e7','#4986e7','#9a9cff','#b99aff',
			'#c2c2c2','#cabdbf','#cca6ac','#f691b2','#cd74e6','#a47ae2',
			'#444444'
		]

		var button_defaults =
		{
			'font' : {
				values:['Arial', 'Courier', 'Comic Sans MS', 'Helvetica', 'Open Sans', 'Tahoma', 'Verdana'],
				icon:'fa fa-font',
				title:'Font'
			},
			'fontSize' : {
				values:{5:'Huge', 3:'Normal', 1:'Small'},
				icon:'fa fa-text-height',
				title:'Font Size'
			},
			'bold' : {
				icon : 'fa fa-bold',
				title : 'Bold (Ctrl/Cmd+B)'
			},
			'italic' : {
				icon : 'fa fa-italic',
				title : 'Italic (Ctrl/Cmd+I)'
			},
			'strikethrough' : {
				icon : 'fa fa-strikethrough',
				title : 'Strikethrough'
			},
			'underline' : {
				icon : 'fa fa-underline',
				title : 'Underline'
			},
			'insertunorderedlist' : {
				icon : 'fa fa-list-ul',
				title : 'Bullet list'
			},
			'insertorderedlist' : {
				icon : 'fa fa-list-ol',
				title : 'Number list'
			},
			'outdent' : {
				icon : 'fa fa-outdent',
				title : 'Reduce indent (Shift+Tab)'
			},
			'indent' : {
				icon : 'fa fa-indent',
				title : 'Indent (Tab)'
			},
			'justifyleft' : {
				icon : 'fa fa-align-left',
				title : 'Align Left (Ctrl/Cmd+L)'
			},
			'justifycenter' : {
				icon : 'fa fa-align-center',
				title : 'Center (Ctrl/Cmd+E)'
			},
			'justifyright' : {
				icon : 'fa fa-align-right',
				title : 'Align Right (Ctrl/Cmd+R)'
			},
			'justifyfull' : {
				icon : 'fa fa-align-justify',
				title : 'Justify (Ctrl/Cmd+J)'
			},
			'createLink' : {
				icon : 'fa fa-link',
				title : 'Hyperlink',
				button_text : 'Add',
				placeholder : 'URL',
				button_class : 'btn-primary'
			},
			'unlink' : {
				icon : 'fa fa-chain-broken',
				title : 'Remove Hyperlink'
			},
			'insertImage' : {
				icon : 'fa fa-picture-o',
				title : 'Insert picture',
				button_text : '<i class="'+ ace.vars['icon'] + 'fa fa-file"></i> Choose Image &hellip;',
				placeholder : 'Image URL',
				button_insert : 'Insert',
				button_class : 'btn-success',
				button_insert_class : 'btn-primary',
				choose_file: true //show the choose file button?
			},
			'foreColor' : {
				values : color_values,
				title : 'Change Color'
			},
			'backColor' : {
				values : color_values,
				title : 'Change Background Color'
			},
			'undo' : {
				icon : 'fa fa-undo',
				title : 'Undo (Ctrl/Cmd+Z)'
			},
			'redo' : {
				icon : 'fa fa-repeat',
				title : 'Redo (Ctrl/Cmd+Y)'
			},
			'viewSource' : {
				icon : 'fa fa-code',
				title : 'View Source'
			}
		}
		
		var toolbar_buttons =
		options.toolbar ||
		[
			'font',
			null,
			'fontSize',
			null,
			'bold',
			'italic',
			'strikethrough',
			'underline',
			null,
			'insertunorderedlist',
			'insertorderedlist',
			'outdent',
			'indent',
			null,
			'justifyleft',
			'justifycenter',
			'justifyright',
			'justifyfull',
			null,
			'createLink',
			'unlink',
			null,
			'insertImage',
			null,
			'foreColor',
			null,
			'undo',
			'redo',
			null,
			'viewSource'
		]


		this.each(function() {
			var toolbar = ' <div class="wysiwyg-toolbar btn-toolbar center"> <div class="btn-group"> ';

			for(var tb in toolbar_buttons) if(toolbar_buttons.hasOwnProperty(tb)) {
				var button = toolbar_buttons[tb];
				if(button === null){
					toolbar += ' </div> <div class="btn-group"> ';
					continue;
				}
				
				if(typeof button == "string" && button in button_defaults) {
					button = button_defaults[button];
					button.name = toolbar_buttons[tb];
				} else if(typeof button == "object" && button.name in button_defaults) {
					button = $.extend(button_defaults[button.name] , button);
				}
				else continue;
				
				var className = "className" in button ? button.className : 'btn-default';
				switch(button.name) {
					case 'font':
						toolbar += ' <a class="btn btn-sm '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+ ace.vars['icon'] + button.icon+'"></i><i class="' + ace.vars['icon'] + 'fa fa-angle-down icon-on-right"></i></a> ';
						toolbar += ' <ul class="dropdown-menu dropdown-light dropdown-caret">';
						for(var font in button.values)
							if(button.values.hasOwnProperty(font))
								toolbar += ' <li><a data-edit="fontName ' + button.values[font] +'" style="font-family:\''+ button.values[font]  +'\'">'+button.values[font]  + '</a></li> '
						toolbar += ' </ul>';
					break;

					case 'fontSize':
						toolbar += ' <a class="btn btn-sm '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+ ace.vars['icon'] + button.icon+'"></i>&nbsp;<i class="'+ ace.vars['icon'] + 'fa fa-angle-down icon-on-right"></i></a> ';
						toolbar += ' <ul class="dropdown-menu dropdown-light dropdown-caret"> ';
						for(var size in button.values)
							if(button.values.hasOwnProperty(size))
								toolbar += ' <li><a data-edit="fontSize '+size+'"><font size="'+size+'">'+ button.values[size] +'</font></a></li> '
						toolbar += ' </ul> ';
					break;

					case 'createLink':
						toolbar += ' <div class="btn-group"> <a class="btn btn-sm '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+ ace.vars['icon'] + button.icon+'"></i></a> ';
						toolbar += ' <div class="dropdown-menu dropdown-caret dropdown-menu-right">\
							 <div class="input-group">\
								<input class="form-control" placeholder="'+button.placeholder+'" type="text" data-edit="'+button.name+'" />\
								<span class="input-group-btn">\
									<button class="btn btn-sm '+button.button_class+'" type="button">'+button.button_text+'</button>\
								</span>\
							 </div>\
						</div> </div>';
					break;

					case 'insertImage':
						toolbar += ' <div class="btn-group"> <a class="btn btn-sm '+className+' dropdown-toggle" data-toggle="dropdown" title="'+button.title+'"><i class="'+ ace.vars['icon'] + button.icon+'"></i></a> ';
						toolbar += ' <div class="dropdown-menu dropdown-caret dropdown-menu-right">\
							 <div class="input-group">\
								<input class="form-control" placeholder="'+button.placeholder+'" type="text" data-edit="'+button.name+'" />\
								<span class="input-group-btn">\
									<button class="btn btn-sm '+button.button_insert_class+'" type="button">'+button.button_insert+'</button>\
								</span>\
							 </div>';
							if( button.choose_file && 'FileReader' in window ) toolbar +=
							 '<div class="space-2"></div>\
							 <label class="center block no-margin-bottom">\
								<button class="btn btn-sm '+button.button_class+' wysiwyg-choose-file" type="button">'+button.button_text+'</button>\
								<input type="file" data-edit="'+button.name+'" />\
							  </label>'
						toolbar += ' </div> </div>';
					break;

					case 'foreColor':
					case 'backColor':
						toolbar += ' <select class="hide wysiwyg_colorpicker" title="'+button.title+'"> ';
						$.each(button.values, function (_, color) {
                            toolbar += ' <option value="' + color + '">' + color + '</option> ';
                        });
						toolbar += ' </select> ';
						toolbar += ' <input style="display:none;" disabled class="hide" type="text" data-edit="'+button.name+'" /> ';
					break;

					case 'viewSource':
						toolbar += ' <a class="btn btn-sm '+className+'" data-view="source" title="'+button.title+'"><i class="'+ ace.vars['icon'] + button.icon+'"></i></a> ';
					break;
					default:
						toolbar += ' <a class="btn btn-sm '+className+'" data-edit="'+button.name+'" title="'+button.title+'"><i class="'+ ace.vars['icon'] + button.icon+'"></i></a> ';
					break;
				}
			}
			toolbar += ' </div> ';
			////////////
			var speech_input;
			if (options.speech_button && 'onwebkitspeechchange' in (speech_input = document.createElement('input'))) {
				toolbar += ' <input class="wysiwyg-speech-input" type="text" data-edit="inserttext" x-webkit-speech />';
			}
			speech_input = null;
			////////////
			toolbar += ' </div> ';


			//if we have a function to decide where to put the toolbar, then call that
			if(options.toolbar_place) toolbar = options.toolbar_place.call(this, toolbar);
			//otherwise put it just before our DIV
			else toolbar = $(this).before(toolbar).prev();

			toolbar.find('a[title]').tooltip({animation:false, container:'body'});
			toolbar.find('.dropdown-menu input[type=text]').on('click', function() {return false})
		    .on('change', function() {$(this).closest('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle')})
			.on('keydown', function (e) {
				if(e.which == 27) {
					this.value = '';
					$(this).change();
				}
				else if(e.which == 13) {
					e.preventDefault();
					e.stopPropagation();
					$(this).change();
				}
			});
			
			toolbar.find('input[type=file]').prev().on(ace.click_event, function (e) { 
				$(this).next().click();
			});
			toolbar.find('.wysiwyg_colorpicker').each(function() {
				$(this).ace_colorpicker({pull_right:true}).change(function(){
					$(this).nextAll('input').eq(0).val(this.value).change();
				}).next().find('.btn-colorpicker').tooltip({title: this.title, animation:false, container:'body'})
			});
			
			
			var self = $(this);
			//view source
			var view_source = false;
			toolbar.find('a[data-view=source]').on('click', function(e){
				e.preventDefault();
				
				if(!view_source) {
					$('<textarea />')
					.css({'width':self.outerWidth(), 'height':self.outerHeight()})
					.val(self.html())
					.insertAfter(self)
					self.hide();
					
					$(this).addClass('active');
				}
				else {
					var textarea = self.next();
					self.html(textarea.val()).show();
					textarea.remove();
					
					$(this).removeClass('active');
				}
				
				view_source = !view_source;
			});


			var $options = $.extend({}, { activeToolbarClass: 'active' , toolbarSelector : toolbar }, options.wysiwyg || {})
			$(this).wysiwyg( $options );
		});

		return this;
	}


})(window.jQuery);



/**
 <b>Spinner</b>. A wrapper for FuelUX spinner element.
 It's just a wrapper so you still need to include FuelUX spinner script first.
*/
(function($ , undefined) {
	//a wrapper for fuelux spinner
	function Ace_Spinner(element , _options) {
		var attrib_values = ace.helper.getAttrSettings(element, $.fn.ace_spinner.defaults);
		var options = $.extend({}, $.fn.ace_spinner.defaults, _options, attrib_values);
	
		var max = options.max
		max = (''+max).length
		var width = parseInt(Math.max((max * 20 + 40) , 90))

		var $element = $(element);
		
		var btn_class = 'btn-sm';//default
		var sizing = 2;
		if($element.hasClass('input-sm')) {
			btn_class = 'btn-xs';
			sizing = 1;
		}
		else if($element.hasClass('input-lg')) {
			btn_class = 'btn-lg';
			sizing = 3;
		}
		
		if(sizing == 2) width += 25;
		else if(sizing == 3) width += 50;
		
		$element.addClass('spinbox-input form-control text-center').wrap('<div class="ace-spinner middle">')

		var $parent_div = $element.closest('.ace-spinner').spinbox(options).wrapInner("<div class='input-group'></div>")
		var $spinner = $parent_div.data('fu.spinbox');
		
		if(options.on_sides)
		{
			$element
			.before('<div class="spinbox-buttons input-group-btn">\
					<button type="button" class="btn spinbox-down '+btn_class+' '+options.btn_down_class+'">\
						<i class="icon-only '+ ace.vars['icon'] + options.icon_down+'"></i>\
					</button>\
				</div>')
			.after('<div class="spinbox-buttons input-group-btn">\
					<button type="button" class="btn spinbox-up '+btn_class+' '+options.btn_up_class+'">\
						<i class="icon-only '+ ace.vars['icon'] + options.icon_up+'"></i>\
					</button>\
				</div>');

			$parent_div.addClass('touch-spinner')
			$parent_div.css('width' , width+'px')
		}
		else {
			 $element
			 .after('<div class="spinbox-buttons input-group-btn">\
					<button type="button" class="btn spinbox-up '+btn_class+' '+options.btn_up_class+'">\
						<i class="icon-only '+ ace.vars['icon'] + options.icon_up+'"></i>\
					</button>\
					<button type="button" class="btn spinbox-down '+btn_class+' '+options.btn_down_class+'">\
						<i class="icon-only '+ ace.vars['icon'] + options.icon_down+'"></i>\
					</button>\
				</div>')

			if(ace.vars['touch'] || options.touch_spinner) {
				$parent_div.addClass('touch-spinner')
				$parent_div.css('width' , width+'px')
			}
			else {
				$element.next().addClass('btn-group-vertical');
				$parent_div.css('width' , width+'px')
			}
		}

		$parent_div.on('changed', function(){
			$element.trigger('change')//trigger the input's change event
		});

		this._call = function(name, arg) {
			$spinner[name](arg);
		}
	}


	$.fn.ace_spinner = function(option, value) {
		var retval;

		var $set = this.each(function() {
			var $this = $(this);
			var data = $this.data('ace_spinner');
			var options = typeof option === 'object' && option;

			if (!data) {
				options = $.extend({}, $.fn.ace_spinner.defaults, option);
				$this.data('ace_spinner', (data = new Ace_Spinner(this, options)));
			}
			if (typeof option === 'string') retval = data._call(option, value);
		});

		return (retval === undefined) ? $set : retval;
	}
	
	$.fn.ace_spinner.defaults = {
		'icon_up' : 'fa fa-chevron-up',
		'icon_down': 'fa fa-chevron-down',
		
		'on_sides': false,		
		'btn_up_class': '',
		'btn_down_class' : '',
		
		'max' : 999,
		'touch_spinner': false
     }


})(window.jQuery);


/**
 <b>Treeview</b>. A wrapper for FuelUX treeview element.
 It's just a wrapper so you still need to include FuelUX treeview script first.
*/
(function($ , undefined) {

	$.fn.aceTree = $.fn.ace_tree = function(options) {
		var $defaults = {
			'open-icon' : ace.vars['icon'] + 'fa fa-folder-open',
			'close-icon' : ace.vars['icon'] + 'fa fa-folder',
			'selectable' : true,
			'selected-icon' : ace.vars['icon'] + 'fa fa-check',
			'unselected-icon' : ace.vars['icon'] + 'fa fa-times',
			'loadingHTML': 'Loading...'
		}

		this.each(function() {
		
			var attrib_values = ace.helper.getAttrSettings(this, $defaults);
			var $options = $.extend({}, $defaults, options, attrib_values);

			var $this = $(this);
			$this.addClass('tree').attr('role', 'tree');
			$this.html(
			'<li class="tree-branch hide" data-template="treebranch" role="treeitem" aria-expanded="false">\
				<div class="tree-branch-header">\
					<span class="tree-branch-name">\
						<i class="icon-folder '+$options['close-icon']+'"></i>\
						<span class="tree-label"></span>\
					</span>\
				</div>\
				<ul class="tree-branch-children" role="group"></ul>\
				<div class="tree-loader" role="alert">'+$options['loadingHTML']+'</div>\
			</div>\
			<li class="tree-item hide" data-template="treeitem" role="treeitem">\
				<span class="tree-item-name">\
				  '+($options['unselected-icon'] == null ? '' : '<i class="icon-item '+$options['unselected-icon']+'"></i>')+'\
				  <span class="tree-label"></span>\
				</span>\
			</li>');
			
			$this.addClass($options['selectable'] == true ? 'tree-selectable' : 'tree-unselectable');
			
			$this.tree($options);
		});

		return this;
	}

})(window.jQuery);


/**
 <b>Wizard</b>. A wrapper for FuelUX wizard element.
 It's just a wrapper so you still need to include FuelUX wizard script first.
*/
(function($ , undefined) {
	$.fn.aceWizard = $.fn.ace_wizard = function(options) {

		this.each(function() {
			var $this = $(this);
			$this.wizard();
			
			if(ace.vars['old_ie']) $this.find('ul.steps > li').last().addClass('last-child');

			var buttons = (options && options['buttons']) ? $(options['buttons']) : $this.siblings('.wizard-actions').eq(0);
			var $wizard = $this.data('fu.wizard');
			$wizard.$prevBtn.remove();
			$wizard.$nextBtn.remove();
			
			$wizard.$prevBtn = buttons.find('.btn-prev').eq(0).on(ace.click_event,  function(){
				$wizard.previous();
			}).attr('disabled', 'disabled');
			$wizard.$nextBtn = buttons.find('.btn-next').eq(0).on(ace.click_event,  function(){
				$wizard.next();
			}).removeAttr('disabled');
			$wizard.nextText = $wizard.$nextBtn.text();
			
			var step = options && ((options.selectedItem && options.selectedItem.step) || options.step);
			if(step) {
				$wizard.currentStep = step;
				$wizard.setState();
			}
		});

		return this;
	}

})(window.jQuery);


/**
 <b>Content Slider</b>. with custom content and elements based on Bootstrap modals.
*/
(function($ , undefined) {
	var $window = $(window);

	function Aside(modal, settings) {
		var self = this;
	
		var $modal = $(modal);
		var placement = 'right', vertical = false;
		var hasFade = $modal.hasClass('fade');//Bootstrap enables transition only when modal is ".fade"

		var attrib_values = ace.helper.getAttrSettings(modal, $.fn.ace_aside.defaults);
		this.settings = $.extend({}, $.fn.ace_aside.defaults, settings, attrib_values);
		
		//if no scroll style specified and modal has dark background, let's make scrollbars 'white'
		if(this.settings.background && !settings.scroll_style && !attrib_values.scroll_style) { 
			this.settings.scroll_style = 'scroll-white no-track';
		}

		
		this.container = this.settings.container;
		if(this.container) {
			try {
				if( $(this.container).get(0) == document.body ) this.container = null;
			} catch(e) {}
		}
		if(this.container) {
			this.settings.backdrop = false;//no backdrop when inside another element?
			$modal.addClass('aside-contained');
		}

		
		var dialog = $modal.find('.modal-dialog');
		var content = $modal.find('.modal-content');
		var delay = 300;
		
		this.initiate = function() {
			modal.className = modal.className.replace(/(\s|^)aside\-(right|top|left|bottom)(\s|$)/ig , '$1$3');

			placement = this.settings.placement;
			if(placement) placement = $.trim(placement.toLowerCase());
			if(!placement || !(/right|top|left|bottom/.test(placement))) placement = 'right';

			$modal.attr('data-placement', placement);
			$modal.addClass('aside-' + placement);
			
			if( /right|left/.test(placement) ) {
				vertical = true;
				$modal.addClass('aside-vc');//vertical
			}
			else $modal.addClass('aside-hz');//horizontal
			
			if( this.settings.fixed ) $modal.addClass('aside-fixed');
			if( this.settings.background ) $modal.addClass('aside-dark');
			if( this.settings.offset ) $modal.addClass('navbar-offset');
			
			if( !this.settings.transition ) $modal.addClass('transition-off');
			
			$modal.addClass('aside-hidden');

			this.insideContainer();
			
			/////////////////////////////
			
			dialog = $modal.find('.modal-dialog');
			content = $modal.find('.modal-content');
			
			if(!this.settings.body_scroll) {
				//don't allow body scroll when modal is open
				$modal.on('mousewheel.aside DOMMouseScroll.aside touchmove.aside pointermove.aside', function(e) {
					if( !$.contains(content[0], e.target) ) {
						e.preventDefault();
						return false;
					}
				})
			}
			
			if( this.settings.backdrop == false ) {
				$modal.addClass('no-backdrop');
			}
		}
		
		
		this.show = function() {
			if(this.settings.backdrop == false) {
			  try {
				$modal.data('bs.modal').$backdrop.remove();
			  } catch(e){}
			}
	
			if(this.container) $(this.container).addClass('overflow-hidden');
			else $modal.css('position', 'fixed')
			
			$modal.removeClass('aside-hidden');
		}
		
		this.hide = function() {
			if(this.container) {
				this.container.addClass('overflow-hidden');
				
				if(ace.vars['firefox']) {
					//firefox needs a bit of forcing re-calculation
					modal.offsetHeight;
				}
			}
		
			toggleButton();
			
			if(ace.vars['transition'] && !hasFade) {
				$modal.one('bsTransitionEnd', function() {
					$modal.addClass('aside-hidden');
					$modal.css('position', '');
					
					if(self.container) self.container.removeClass('overflow-hidden');
				}).emulateTransitionEnd(delay);
			}
		}
		
		this.shown = function() {
			toggleButton();
			$('body').removeClass('modal-open').css('padding-right', '');
			
			if( this.settings.backdrop == 'invisible' ) {
			  try {
				$modal.data('bs.modal').$backdrop.css('opacity', 0);
			  } catch(e){}
			}

			var size = !vertical ? dialog.height() : content.height();
			if(!ace.vars['touch']) {
				if(!content.hasClass('ace-scroll')) {
					content.ace_scroll({
							size: size,
							reset: true,
							mouseWheelLock: true,
							lockAnyway: !this.settings.body_scroll,
							styleClass: this.settings.scroll_style,
							'observeContent': true,
							'hideOnIdle': !ace.vars['old_ie'],
							'hideDelay': 1500
					})
				}
			}
			else {
				content.addClass('overflow-scroll').css('max-height', size+'px');
			}

			$window
			.off('resize.modal.aside')
			.on('resize.modal.aside', function() {
				if(!ace.vars['touch']) {
				  content.ace_scroll('disable');//to get correct size when going from small window size to large size
					var size = !vertical ? dialog.height() : content.height();
					content
					.ace_scroll('update', {'size': size})
					.ace_scroll('enable')
					.ace_scroll('reset');
				}
				else content.css('max-height', (!vertical ? dialog.height() : content.height())+'px');
			}).triggerHandler('resize.modal.aside');
			
			
			///////////////////////////////////////////////////////////////////////////
			if(self.container && ace.vars['transition'] && !hasFade) {
				$modal.one('bsTransitionEnd', function() {
					self.container.removeClass('overflow-hidden')
				}).emulateTransitionEnd(delay);
			}
		}
		
		
		this.hidden = function() {
			$window.off('.aside')
			//$modal.off('.aside')
			//			
			if( !ace.vars['transition'] || hasFade ) {
				$modal.addClass('aside-hidden');
				$modal.css('position', '');
			}
		}
		
		
		this.insideContainer = function() {
			var container = $('.main-container');

			var dialog = $modal.find('.modal-dialog');
			dialog.css({'right': '', 'left': ''});
			if( container.hasClass('container') ) {
				var flag = false;
				if(vertical == true) {
					dialog.css( placement, parseInt(($window.width() - container.width()) / 2) );
					flag = true;
				}

				//strange firefox issue, not redrawing properly on window resize (zoom in/out)!!!!
				//--- firefix is still having issue!
				if(flag && ace.vars['firefox']) {
					ace.helper.redraw(container[0]);
				}
			}
		}
		
		this.flip = function() {
			var flipSides = {right : 'left', left : 'right', top: 'bottom', bottom: 'top'};
			$modal.removeClass('aside-'+placement).addClass('aside-'+flipSides[placement]);
			placement = flipSides[placement];
		}

		var toggleButton = function() {
			var btn = $modal.find('.aside-trigger');
			if(btn.length == 0) return;
			btn.toggleClass('open');
			
			var icon = btn.find(ace.vars['.icon']);
			if(icon.length == 0) return;
			icon.toggleClass(icon.attr('data-icon1') + " " + icon.attr('data-icon2'));
		}
		

		this.initiate();
		
		if(this.container) this.container = $(this.container);
		$modal.appendTo(this.container || 'body'); 
	}


	$(document)
	.on('show.bs.modal', '.modal.aside', function(e) {
		$('.aside.in').modal('hide');//??? hide previous open ones?
		$(this).ace_aside('show');
	})
	.on('hide.bs.modal', '.modal.aside', function(e) {
		$(this).ace_aside('hide');
	})
	.on('shown.bs.modal', '.modal.aside', function(e) {
		$(this).ace_aside('shown');
	})
	.on('hidden.bs.modal', '.modal.aside', function(e) {
		$(this).ace_aside('hidden');
	})
	
	

	
	$(window).on('resize.aside_container', function() {
		$('.modal.aside').ace_aside('insideContainer');
	});
	$(document).on('settings.ace.aside', function(e, event_name) {
		if(event_name == 'main_container_fixed') $('.modal.aside').ace_aside('insideContainer');
	});

	$.fn.aceAside = $.fn.ace_aside = function (option, value) {
		var method_call;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_aside');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_aside', (data = new Aside(this, options)));
			if (typeof option === 'string' && typeof data[option] === 'function') {
				if(value instanceof Array) method_call = data[option].apply(data, value);
				else method_call = data[option](value);
			}
		});

		return (method_call === undefined) ? $set : method_call;
	}
	
	$.fn.ace_aside.defaults = {
		fixed: false,
		background: false,
		offset: false,
		body_scroll: false,
		transition: true,
		scroll_style: 'scroll-dark no-track',
		container: null,
		backdrop: false,
		placement: 'right'
     }

})(window.jQuery);

;/**
 Required. Ace's Basic File to Initiliaze Different Parts and Some Variables.
*/


//some basic variables
(function(undefined) {
	if( !('ace' in window) ) window['ace'] = {}
	if( !('helper' in window['ace']) ) window['ace'].helper = {}
	if( !('vars' in window['ace']) ) window['ace'].vars = {}
	window['ace'].vars['icon'] = ' ace-icon ';
	window['ace'].vars['.icon'] = '.ace-icon';

	ace.vars['touch']	= ('ontouchstart' in window);//(('ontouchstart' in document.documentElement) || (window.DocumentTouch && document instanceof DocumentTouch));
	
	//sometimes the only good way to work around browser's pecularities is to detect them using user-agents
	//though it's not accurate
	var agent = navigator.userAgent
	ace.vars['webkit'] = !!agent.match(/AppleWebKit/i)
	ace.vars['safari'] = !!agent.match(/Safari/i) && !agent.match(/Chrome/i);
	ace.vars['android'] = ace.vars['safari'] && !!agent.match(/Android/i)
	ace.vars['ios_safari'] = !!agent.match(/OS ([4-9])(_\d)+ like Mac OS X/i) && !agent.match(/CriOS/i)
	
	ace.vars['ie'] = window.navigator.msPointerEnabled || (document.all && document.querySelector);//8-11
	ace.vars['old_ie'] = document.all && !document.addEventListener;//8 and below
	ace.vars['very_old_ie']	= document.all && !document.querySelector;//7 and below
	ace.vars['firefox'] = 'MozAppearance' in document.documentElement.style;
	
	ace.vars['non_auto_fixed'] = ace.vars['android'] || ace.vars['ios_safari'];
})();



(function($ , undefined) {
	//sometimes we try to use 'tap' event instead of 'click' if jquery mobile plugin is available
	ace['click_event'] = ace.vars['touch'] && $.fn.tap ? 'tap' : 'click';
})(jQuery);




//document ready function
jQuery(function($) {
	basics();
	enableSidebar();
	
	enableDemoAjax();
	handleScrollbars();
	
	dropdownAutoPos();
	
	navbarHelpers();
	sidebarTooltips();
	
	scrollTopBtn();
	
	someBrowserFix();
	
	bsCollapseToggle();
	smallDeviceDropdowns();
	
	////////////////////////////

	function basics() {
		// for android and ios we don't use "top:auto" when breadcrumbs is fixed
		if(ace.vars['non_auto_fixed']) {
			$('body').addClass('mob-safari');
		}

		ace.vars['transition'] = !!$.support.transition.end
	}
	
	function enableSidebar() {
		//initiate sidebar function
		var $sidebar = $('.sidebar');
		if($.fn.ace_sidebar) $sidebar.ace_sidebar();
		if($.fn.ace_sidebar_scroll) $sidebar.ace_sidebar_scroll({
			//for other options please see documentation
			'include_toggle': false || ace.vars['safari'] || ace.vars['ios_safari'] //true = include toggle button in the scrollbars
		});
		if($.fn.ace_sidebar_hover)	$sidebar.ace_sidebar_hover({
			'sub_hover_delay': 750,
			'sub_scroll_style': 'no-track scroll-thin scroll-margin scroll-visible'
		});
	}

	
	//Load content via ajax
	function enableDemoAjax() {		
		if(!$.fn.ace_ajax) return;
 
		if(window.Pace) {
			window.paceOptions = {
				ajax: true,
				document: true,
				eventLag: false // disabled
				//elements: {selectors: ['.page-content-area']}
			}
		}

		var demo_ajax_options = {
			 'close_active': true,
			 
			 'default_url': 'page/index',//default hash
			 'content_url': function(hash) {
				//***NOTE***
				//this is for Ace demo only, you should change it to return a valid URL
				//please refer to documentation for more info

				if( !hash.match(/^page\//) ) return false;
				var path = document.location.pathname;

				//for example in Ace HTML demo version we convert /ajax/index.html#page/gallery to > /ajax/content/gallery.html and load it
				if(path.match(/(\/ajax\/)(index\.html)?/))
					return path.replace(/(\/ajax\/)(index\.html)?/, '/ajax/content/'+hash.replace(/^page\//, '')+'.html') ;

				//for example in Ace PHP demo version we convert "ajax.php#page/dashboard" to "ajax.php?page=dashboard" and load it
				return path + "?" + hash.replace(/\//, "=");
			  }			  
		}
		   
		//for IE9 and below we exclude PACE loader (using conditional IE comments)
		//for other browsers we use the following extra ajax loader options
		if(window.Pace) {
			demo_ajax_options['loading_overlay'] = 'body';//the opaque overlay is applied to 'body'
		}

		//initiate ajax loading on this element( which is .page-content-area[data-ajax-content=true] in Ace's demo)
		$('[data-ajax-content=true]').ace_ajax(demo_ajax_options)

		//if general error happens and ajax is working, let's stop loading icon & PACE
		$(window).on('error.ace_ajax', function() {
			$('[data-ajax-content=true]').each(function() {
				var $this = $(this);
				if( $this.ace_ajax('working') ) {
					if(window.Pace && Pace.running) Pace.stop();
					$this.ace_ajax('stopLoading', true);
				}
			})
		})
	}

	/////////////////////////////

	function handleScrollbars() {
		//add scrollbars for navbar dropdowns
		var has_scroll = !!$.fn.ace_scroll;
		if(has_scroll) $('.dropdown-content').ace_scroll({reset: false, mouseWheelLock: true})

		//reset scrolls bars on window resize
		if(has_scroll && !ace.vars['old_ie']) {//IE has an issue with widget fullscreen on ajax?!!!
			$(window).on('resize.reset_scroll', function() {
				$('.ace-scroll:not(.scroll-disabled)').not(':hidden').ace_scroll('reset');
			});
			if(has_scroll) $(document).on('settings.ace.reset_scroll', function(e, name) {
				if(name == 'sidebar_collapsed') $('.ace-scroll:not(.scroll-disabled)').not(':hidden').ace_scroll('reset');
			});
		}
	}


	function dropdownAutoPos() {
		//change a dropdown to "dropup" depending on its position
		$(document).on('click.dropdown.pos', '.dropdown-toggle[data-position="auto"]', function() {
			var offset = $(this).offset();
			var parent = $(this.parentNode);

			if ( parseInt(offset.top + $(this).height()) + 50 
					>
				(ace.helper.scrollTop() + ace.helper.winHeight() - parent.find('.dropdown-menu').eq(0).height()) 
				) parent.addClass('dropup');
			else parent.removeClass('dropup');
		});
	}

	
	function navbarHelpers() {
		//prevent dropdowns from hiding when a from is clicked
		/**$(document).on('click', '.dropdown-navbar form', function(e){
			e.stopPropagation();
		});*/


		//disable navbar icon animation upon click
		$('.ace-nav [class*="icon-animated-"]').closest('a').one('click', function(){
			var icon = $(this).find('[class*="icon-animated-"]').eq(0);
			var $match = icon.attr('class').match(/icon\-animated\-([\d\w]+)/);
			icon.removeClass($match[0]);
		});


		//prevent dropdowns from hiding when a tab is selected
		$(document).on('click', '.dropdown-navbar .nav-tabs', function(e){
			e.stopPropagation();
			var $this , href
			var that = e.target
			if( ($this = $(e.target).closest('[data-toggle=tab]')) && $this.length > 0) {
				$this.tab('show');
				e.preventDefault();
				$(window).triggerHandler('resize.navbar.dropdown')
			}
		});
	}

	
	function sidebarTooltips() {
		//tooltip in sidebar items
		$('.sidebar .nav-list .badge[title],.sidebar .nav-list .badge[title]').each(function() {
			var tooltip_class = $(this).attr('class').match(/tooltip\-(?:\w+)/);
			tooltip_class = tooltip_class ? tooltip_class[0] : 'tooltip-error';
			$(this).tooltip({
				'placement': function (context, source) {
					var offset = $(source).offset();

					if( parseInt(offset.left) < parseInt(document.body.scrollWidth / 2) ) return 'right';
					return 'left';
				},
				container: 'body',
				template: '<div class="tooltip '+tooltip_class+'"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
			});
		});
		
		//or something like this if items are dynamically inserted
		/**
		$('.sidebar').tooltip({
			'placement': function (context, source) {
				var offset = $(source).offset();

				if( parseInt(offset.left) < parseInt(document.body.scrollWidth / 2) ) return 'right';
				return 'left';
			},
			selector: '.nav-list .badge[title],.nav-list .label[title]',
			container: 'body',
			template: '<div class="tooltip tooltip-error"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
		});
		*/
	}
	
	

	function scrollTopBtn() {
		//the scroll to top button
		var scroll_btn = $('.btn-scroll-up');
		if(scroll_btn.length > 0) {
			var is_visible = false;
			$(window).on('scroll.scroll_btn', function() {
				var scroll = ace.helper.scrollTop();
				var h = ace.helper.winHeight();
				var body_sH = document.body.scrollHeight;
				if(scroll > parseInt(h / 4) || (scroll > 0 && body_sH >= h && h + scroll >= body_sH - 1)) {//|| for smaller pages, when reached end of page
					if(!is_visible) {
						scroll_btn.addClass('display');
						is_visible = true;
					}
				} else {
					if(is_visible) {
						scroll_btn.removeClass('display');
						is_visible = false;
					}
				}
			}).triggerHandler('scroll.scroll_btn');

			scroll_btn.on(ace.click_event, function(){
				var duration = Math.min(500, Math.max(100, parseInt(ace.helper.scrollTop() / 3)));
				$('html,body').animate({scrollTop: 0}, duration);
				return false;
			});
		}
	}


	
	function someBrowserFix() {
		//chrome and webkit have a problem here when resizing from 479px to more
		//we should force them redraw the navbar!
		if( ace.vars['webkit'] ) {
			var ace_nav = $('.ace-nav').get(0);
			if( ace_nav ) $(window).on('resize.webkit_fix' , function(){
				ace.helper.redraw(ace_nav);
			});
		}
		
		
		//fix an issue with ios safari, when an element is fixed and an input receives focus
		if(ace.vars['ios_safari']) {
		  $(document).on('ace.settings.ios_fix', function(e, event_name, event_val) {
			if(event_name != 'navbar_fixed') return;

			$(document).off('focus.ios_fix blur.ios_fix', 'input,textarea,.wysiwyg-editor');
			if(event_val == true) {
			  $(document).on('focus.ios_fix', 'input,textarea,.wysiwyg-editor', function() {
				$(window).on('scroll.ios_fix', function() {
					var navbar = $('#navbar').get(0);
					if(navbar) ace.helper.redraw(navbar);
				});
			  }).on('blur.ios_fix', 'input,textarea,.wysiwyg-editor', function() {
				$(window).off('scroll.ios_fix');
			  })
			}
		  }).triggerHandler('ace.settings.ios_fix', ['navbar_fixed', $('#navbar').css('position') == 'fixed']);
		}
	}

	
	
	function bsCollapseToggle() {
		//bootstrap collapse component icon toggle
		$(document).on('hide.bs.collapse show.bs.collapse', function (ev) {
			var panel_id = ev.target.getAttribute('id')
			var panel = $('a[href*="#'+ panel_id+'"]');
			if(panel.length == 0) panel = $('a[data-target*="#'+ panel_id+'"]');
			if(panel.length == 0) return;

			panel.find(ace.vars['.icon']).each(function(){
				var $icon = $(this)

				var $match
				var $icon_down = null
				var $icon_up = null
				if( ($icon_down = $icon.attr('data-icon-show')) ) {
					$icon_up = $icon.attr('data-icon-hide')
				}
				else if( $match = $icon.attr('class').match(/fa\-(.*)\-(up|down)/) ) {
					$icon_down = 'fa-'+$match[1]+'-down'
					$icon_up = 'fa-'+$match[1]+'-up'
				}

				if($icon_down) {
					if(ev.type == 'show') $icon.removeClass($icon_down).addClass($icon_up)
						else $icon.removeClass($icon_up).addClass($icon_down)
						
					return false;//ignore other icons that match, one is enough
				}

			});
		})
	}
	

	
	//in small devices display navbar dropdowns like modal boxes
	function smallDeviceDropdowns() {
	  if(ace.vars['old_ie']) return;
	  
	  $('.ace-nav > li')
	  .on('shown.bs.dropdown.navbar', function(e) {
		adjustNavbarDropdown.call(this);
	  })
	  .on('hidden.bs.dropdown.navbar', function(e) {
		$(window).off('resize.navbar.dropdown');
		resetNavbarDropdown.call(this);
	  })
	 
	  function adjustNavbarDropdown() {
		var $sub = $(this).find('> .dropdown-menu');

		if( $sub.css('position') == 'fixed' ) {
			var win_width = parseInt($(window).width());
			var offset_w = win_width > 320 ? 60 : (win_width > 240 ? 40 : 30);
			var avail_width = parseInt(win_width) - offset_w;
			var avail_height = parseInt($(window).height()) - 30;
			
			var width = parseInt(Math.min(avail_width , 320));
			//we set 'width' here for text wrappings and spacings to take effect before calculating scrollHeight
			$sub.css('width', width);

			var tabbed = false;
			var extra_parts = 0;
			var dropdown_content = $sub.find('.tab-pane.active .dropdown-content.ace-scroll');
			if(dropdown_content.length == 0) dropdown_content = $sub.find('.dropdown-content.ace-scroll');
			else tabbed = true;

			var parent_menu = dropdown_content.closest('.dropdown-menu');
			var scrollHeight = $sub[0].scrollHeight;
			if(dropdown_content.length == 1) {
				//sometimes there's no scroll-content, for example in detached scrollbars
				var content =  dropdown_content.find('.scroll-content')[0];
				if(content) {
					scrollHeight = content.scrollHeight;
				}
			
				extra_parts += parent_menu.find('.dropdown-header').outerHeight();
				extra_parts += parent_menu.find('.dropdown-footer').outerHeight();
				
				var tab_content = parent_menu.closest('.tab-content');
				if( tab_content.length != 0 ) {
					extra_parts += tab_content.siblings('.nav-tabs').eq(0).height();
				}
			}
			

			
			var height = parseInt(Math.min(avail_height , 480, scrollHeight + extra_parts));
			var left = parseInt(Math.abs((avail_width + offset_w - width)/2));
			var top = parseInt(Math.abs((avail_height + 30 - height)/2));

			
			var zindex = parseInt($sub.css('z-index')) || 0;

			$sub.css({'height': height, 'left': left, 'right': 'auto', 'top': top - (!tabbed ? 1 : 3)});
			if(dropdown_content.length == 1) {
				if(!ace.vars['touch']) {
					dropdown_content.ace_scroll('update', {size: height - extra_parts}).ace_scroll('enable').ace_scroll('reset');
				}
				else {
					dropdown_content
					.ace_scroll('disable').css('max-height', height - extra_parts).addClass('overflow-scroll');
				}
			}
			$sub.css('height', height + (!tabbed ? 2 : 7));//for bottom border adjustment and tab content paddings
			
			
			if($sub.hasClass('user-menu')) {
				$sub.css('height', '');//because of user-info hiding/showing at different widths, which changes above 'scrollHeight', so we remove it!
				
				//user menu is re-positioned in small widths
				//but we need to re-position again in small heights as well (modal mode)
				var user_info = $(this).find('.user-info');
				if(user_info.length == 1 && user_info.css('position') == 'fixed') {
					user_info.css({'left': left, 'right': 'auto', 'top': top, 'width': width - 2, 'max-width': width - 2, 'z-index': zindex + 1});
				}
				else user_info.css({'left': '', 'right': '', 'top': '', 'width': '', 'max-width': '', 'z-index': ''});
			}
			
			//dropdown's z-index is limited by parent .navbar's z-index (which doesn't make sense because dropdowns are fixed!)
			//so for example when in 'content-slider' page, fixed modal toggle buttons go above are dropdowns
			//so we increase navbar's z-index to fix this!
			$(this).closest('.navbar.navbar-fixed-top').css('z-index', zindex);
		}
		else {
			if($sub.length != 0) resetNavbarDropdown.call(this, $sub);
		}
		
		var self = this;
		$(window)
		.off('resize.navbar.dropdown')
		.one('resize.navbar.dropdown', function() {
			$(self).triggerHandler('shown.bs.dropdown.navbar');
		})
	  }

	  //reset scrollbars and user menu
	  function resetNavbarDropdown($sub) {
		$sub = $sub || $(this).find('> .dropdown-menu');
	  
	    if($sub.length > 0) {
			$sub
			.css({'width': '', 'height': '', 'left': '', 'right': '', 'top': ''})
			.find('.dropdown-content').each(function() {
				if(ace.vars['touch']) {
					$(this).css('max-height', '').removeClass('overflow-scroll');
				}

				var size = parseInt($(this).attr('data-size') || 0) || $.fn.ace_scroll.defaults.size;
				$(this).ace_scroll('update', {size: size}).ace_scroll('enable').ace_scroll('reset');
			})
			
			if( $sub.hasClass('user-menu') ) {
				var user_info = 
				$(this).find('.user-info')
				.css({'left': '', 'right': '', 'top': '', 'width': '', 'max-width': '', 'z-index': ''});
			}
		}
		
		$(this).closest('.navbar').css('z-index', '');
	  }
	}

});//jQuery document ready





//some ace helper functions
(function($$ , undefined) {//$$ is ace.helper
 $$.unCamelCase = function(str) {
	return str.replace(/([a-z])([A-Z])/g, function(match, c1, c2){ return c1+'-'+c2.toLowerCase() })
 }
 $$.strToVal = function(str) {
	var res = str.match(/^(?:(true)|(false)|(null)|(\-?[\d]+(?:\.[\d]+)?)|(\[.*\]|\{.*\}))$/i);

	var val = str;
	if(res) {
		if(res[1]) val = true;
		else if(res[2]) val = false;
		else if(res[3]) val = null;	
		else if(res[4]) val = parseFloat(str);
		else if(res[5]) {
			try { val = JSON.parse(str) }
			catch (err) {}
		}
	}

	return val;
 }
 $$.getAttrSettings = function(el, attr_list, prefix) {
	var list_type = attr_list instanceof Array ? 1 : 2;
	//attr_list can be Array or Object(key/value)
	var prefix = prefix ? prefix.replace(/([^\-])$/ , '$1-') : '';
	prefix = 'data-' + prefix;

	var settings = {}
	for(var li in attr_list) if(attr_list.hasOwnProperty(li)) {
		var name = list_type == 1 ? attr_list[li] : li;
		var attr_val, attr_name = $$.unCamelCase(name.replace(/[^A-Za-z0-9]{1,}/g , '-')).toLowerCase()

		if( ! ((attr_val = el.getAttribute(prefix + attr_name))  ) ) continue;
		settings[name] = $$.strToVal(attr_val);
	}

	return settings;
 }

 $$.scrollTop = function() {
	return document.scrollTop || document.documentElement.scrollTop || document.body.scrollTop
 }
 $$.winHeight = function() {
	return window.innerHeight || document.documentElement.clientHeight;
 }
 $$.redraw = function(elem, force) {
	var saved_val = elem.style['display'];
	elem.style.display = 'none';
	elem.offsetHeight;
	if(force !== true) {
		elem.style.display = saved_val;
	}
	else {
		//force redraw for example in old IE
		setTimeout(function() {
			elem.style.display = saved_val;
		}, 10);
	}
 }
})(ace.helper);

/**
 <b>Load content via Ajax </b>. For more information please refer to documentation #basics/ajax
*/

(function($ , undefined) {
	var ajax_loaded_scripts = {}

	function AceAjax(contentArea, settings) {
		var $contentArea = $(contentArea);
		var self = this;
		$contentArea.attr('data-ajax-content', 'true');
		
		//get a list of 'data-*' attributes that override 'defaults' and 'settings'
		var attrib_values = ace.helper.getAttrSettings(contentArea, $.fn.ace_ajax.defaults);
		this.settings = $.extend({}, $.fn.ace_ajax.defaults, settings, attrib_values);


		var working = false;
		var $overlay = $();//empty set

		this.force_reload = false;//set jQuery ajax's cache option to 'false' to reload content
		this.loadUrl = function(hash, cache) {
			var url = false;
			hash = hash.replace(/^(\#\!)?\#/, '');
			
			this.force_reload = (cache === false)
			
			if(typeof this.settings.content_url === 'function') url = this.settings.content_url(hash);
			if(typeof url === 'string') this.getUrl(url, hash, false);
		}
		
		this.loadAddr = function(url, hash, cache) {
			this.force_reload = (cache === false);
			this.getUrl(url, hash, false);
		}
		
		this.getUrl = function(url, hash, manual_trigger) {
			if(working) {
				return;
			}
		
			var event
			$contentArea.trigger(event = $.Event('ajaxloadstart'), {url: url, hash: hash})
			if (event.isDefaultPrevented()) return;
			
			self.startLoading();

			$.ajax({
				'url': url,
				'cache': !this.force_reload
			})
			.error(function() {
				$contentArea.trigger('ajaxloaderror', {url: url, hash: hash});
				
				self.stopLoading(true);
			})
			.done(function(result) {
				$contentArea.trigger('ajaxloaddone', {url: url, hash: hash});
				
				var link_element = null, link_text = '';;
				if(typeof self.settings.update_active === 'function') {
					link_element = self.settings.update_active.call(null, hash, url);
				}
				else if(self.settings.update_active === true && hash) {
					link_element = $('a[data-url="'+hash+'"]');
					if(link_element.length > 0) {
						var nav = link_element.closest('.nav');
						if(nav.length > 0) {
							nav.find('.active').each(function(){
								var $class = 'active';
								if( $(this).hasClass('hover') || self.settings.close_active ) $class += ' open';
								
								$(this).removeClass($class);							
								if(self.settings.close_active) {
									$(this).find(' > .submenu').css('display', '');
								}
							})
							
							var active_li = link_element.closest('li').addClass('active').parents('.nav li').addClass('active open');
							nav.closest('.sidebar[data-sidebar-scroll=true]').each(function() {
								var $this = $(this);
								$this.ace_sidebar_scroll('reset');
								if(manual_trigger) $this.ace_sidebar_scroll('scroll_to_active');//first time only
							})
						}
					}
				}

				/////////
				if(typeof self.settings.update_breadcrumbs === 'function') {
					link_text = self.settings.update_breadcrumbs.call(null, hash, url, link_element);
				}
				else if(self.settings.update_breadcrumbs === true && link_element != null && link_element.length > 0) {
					link_text = updateBreadcrumbs(link_element);
				}
				/////////

				//convert "title" and "link" tags to "div" tags for later processing
				result = String(result)
					.replace(/<(title|link)([\s\>])/gi,'<div class="hidden ajax-append-$1"$2')
					.replace(/<\/(title|link)\>/gi,'</div>')
			
				
				$overlay.addClass('content-loaded').detach();
				$contentArea.empty().html(result);
				
				$(self.settings.loading_overlay || $contentArea).append($overlay);
	
				//remove previous stylesheets inserted via ajax
				setTimeout(function() {
					$('head').find('link.ace-ajax-stylesheet').remove();

					var main_selectors = ['link.ace-main-stylesheet', 'link#main-ace-style', 'link[href*="/ace.min.css"]', 'link[href*="/ace.css"]']
					var ace_style = [];
					for(var m = 0; m < main_selectors.length; m++) {
						ace_style = $('head').find(main_selectors[m]).first();
						if(ace_style.length > 0) break;
					}
					
					$contentArea.find('.ajax-append-link').each(function(e) {
						var $link = $(this);
						if ( $link.attr('href') ) {
							var new_link = jQuery('<link />', {type : 'text/css', rel: 'stylesheet', 'class': 'ace-ajax-stylesheet'})
							if( ace_style.length > 0 ) new_link.insertBefore(ace_style);
							else new_link.appendTo('head');
							new_link.attr('href', $link.attr('href'));//we set "href" after insertion, for IE to work
						}
						$link.remove();
					})
				}, 10);

				//////////////////////

				if(typeof self.settings.update_title === 'function') {
					self.settings.update_title.call(null, hash, url, link_text);
				}
				else if(self.settings.update_title === true) {
					updateTitle(link_text);
				}
				

				if( !manual_trigger ) {
					$('html,body').animate({scrollTop: 0}, 250);
				}

				//////////////////////
				$contentArea.trigger('ajaxloadcomplete', {url: url, hash: hash});
				//////////////////////
				
				self.stopLoading();
			})
		}
		
		
		///////////////////////
		var fixPos = false;
		var loadTimer = null;
		this.startLoading = function() {
			if(working) return;
			working = true;
			
			if(!this.settings.loading_overlay && $contentArea.css('position') == 'static') {
				$contentArea.css('position', 'relative');//for correct icon positioning
				fixPos = true;
			}
				
			$overlay.remove();
			$overlay = $('<div class="ajax-loading-overlay"><i class="ajax-loading-icon '+(this.settings.loading_icon || '')+'"></i> '+this.settings.loading_text+'</div>')

			if(this.settings.loading_overlay == 'body') $('body').append($overlay.addClass('ajax-overlay-body'));
			else if(this.settings.loading_overlay) $(this.settings.loading_overlay).append($overlay);
			else $contentArea.append($overlay);

			
			if(this.settings.max_load_wait !== false) 
			 loadTimer = setTimeout(function() {
				loadTimer = null;
				if(!working) return;
				
				var event
				$contentArea.trigger(event = $.Event('ajaxloadlong'))
				if (event.isDefaultPrevented()) return;
				
				self.stopLoading(true);
			 }, this.settings.max_load_wait * 1000);
		}
		
		this.stopLoading = function(stopNow) {
			if(stopNow === true) {
				working = false;
				
				$overlay.remove();
				if(fixPos) {
					$contentArea.css('position', '');//restore previous 'position' value
					fixPos = false;
				}
				
				if(loadTimer != null) {
					clearTimeout(loadTimer);
					loadTimer = null;
				}
			}
			else {
				$overlay.addClass('almost-loaded');
				
				$contentArea.one('ajaxscriptsloaded.inner_call', function() {
					self.stopLoading(true);
					/**
					if(window.Pace && Pace.running == true) {
						Pace.off('done');
						Pace.once('done', function() { self.stopLoading(true) })
					}
					else self.stopLoading(true);
					*/
				})
			}
		}
		
		this.working = function() {
			return working;
		}
		///////////////////////
		
		
		
		function updateBreadcrumbs(link_element) {
			var link_text = '';
		 
			//update breadcrumbs
			var breadcrumbs = $('.breadcrumb');
			if(breadcrumbs.length > 0 && breadcrumbs.is(':visible')) {
				breadcrumbs.find('> li:not(:first-child)').remove();

				var i = 0;		
				link_element.parents('.nav li').each(function() {
					var link = $(this).find('> a');
					
					var link_clone = link.clone();
					link_clone.find('i,.fa,.glyphicon,.ace-icon,.menu-icon,.badge,.label').remove();
					var text = link_clone.text();
					link_clone.remove();
					
					var href = link.attr('href');

					if(i == 0) {
						var li = $('<li class="active"></li>').appendTo(breadcrumbs);
						li.text(text);
						link_text = text;
					}
					else {
						var li = $('<li><a /></li>').insertAfter(breadcrumbs.find('> li:first-child'));
						li.find('a').attr('href', href).text(text);
					}
					i++;
				})
			}
			
			return link_text;
		 }
		 
		 function updateTitle(link_text) {
			var $title = $contentArea.find('.ajax-append-title');
			if($title.length > 0) {
				document.title = $title.text();
				$title.remove();
			}
			else if(link_text.length > 0) {
				var extra = $.trim(String(document.title).replace(/^(.*)[\-]/, ''));//for example like " - Ace Admin"
				if(extra) extra = ' - ' + extra;
				link_text = $.trim(link_text) + extra;
			}
		 }
		 
		 
		 this.loadScripts = function(scripts, callback) {
			$.ajaxPrefilter('script', function(opts) {opts.cache = true});
			setTimeout(function() {
				//let's keep a list of loaded scripts so that we don't load them more than once!
				
				function finishLoading() {
					if(typeof callback === 'function') callback();
					$('.btn-group[data-toggle="buttons"] > .btn').button();
					
					$contentArea.trigger('ajaxscriptsloaded');
				}
				
				//var deferreds = [];
				var deferred_count = 0;//deferreds count
				var resolved = 0;
				for(var i = 0; i < scripts.length; i++) if(scripts[i]) {
					(function() {
						var script_name = "js-"+scripts[i].replace(/[^\w\d\-]/g, '-').replace(/\-\-/g, '-');
						if( ajax_loaded_scripts[script_name] !== true )	deferred_count++;
					})()
				}
				

				function nextScript(index) {
					index += 1;
					if(index < scripts.length) loadScript(index);
					else {
						finishLoading();
					}
				}
				
				function loadScript(index) {
					index = index || 0;
					if(!scripts[index]) {//could be null sometimes
						return nextScript(index);
					}
				
					var script_name = "js-"+scripts[index].replace(/[^\w\d\-]/g, '-').replace(/\-\-/g, '-');
					//only load scripts that are not loaded yet!
					if( ajax_loaded_scripts[script_name] !== true ) {
						$.getScript(scripts[index])
						.done(function() {
							ajax_loaded_scripts[script_name] = true;
						})
						//.fail(function() {
						//})
						.complete(function() {
							resolved++;
							if(resolved >= deferred_count && working) {
								finishLoading();
							}
							else {
								nextScript(index);
							}
						})
					}
					else {//script previoisly loaded
						nextScript(index);
					}
				}
				
				
				if (deferred_count > 0) {
					loadScript();
				}
				else {
					finishLoading();
				}

			}, 10)
		}
		
		
		
		/////////////////
		$(window)
		.off('hashchange.ace_ajax')
		.on('hashchange.ace_ajax', function(e, manual_trigger) {
			var hash = $.trim(window.location.hash);
			if(!hash || hash.length == 0) return;
			
			self.loadUrl(hash);
		}).trigger('hashchange.ace_ajax', [true]);
		
		var hash = $.trim(window.location.hash);
		if(!hash && this.settings.default_url) window.location.hash = this.settings.default_url;

	}//AceAjax



	$.fn.aceAjax = $.fn.ace_ajax = function (option, value, value2, value3) {
		var method_call;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_ajax');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_ajax', (data = new AceAjax(this, options)));
			if (typeof option === 'string' && typeof data[option] === 'function') {
				if(value3 != undefined) method_call = data[option](value, value2, value3);
				else if(value2 != undefined) method_call = data[option](value, value2);
				else method_call = data[option](value);
			}
		});

		return (method_call === undefined) ? $set : method_call;
	}
	
	
	
	$.fn.aceAjax.defaults = $.fn.ace_ajax.defaults = {
		content_url: false,
		default_url: false,
		loading_icon: 'fa fa-spin fa-spinner fa-2x orange',
		loading_text: '',
		loading_overlay: null,
		update_breadcrumbs: true,
		update_title: true,
		update_active: true,
		close_active: false,
		max_load_wait: false
     }

})(window.jQuery);



/**
 <b>Custom drag event for touch devices</b> used in scrollbars.
 For better touch event handling and extra options a more advanced solution such as <u>Hammer.js</u> is recommended.
*/

//based on but not dependent on jQuery mobile
/*
* jQuery Mobile v1.3.2
* http://jquerymobile.com
*
* Copyright 2010, 2013 jQuery Foundation, Inc. and other contributors
* Released under the MIT license.
* http://jquery.org/license
*
*/
(function($ , undefined) {

	if(!ace.vars['touch']) return;

	var touchStartEvent = "touchstart MSPointerDown pointerdown",// : "mousedown",
			touchStopEvent  =  "touchend touchcancel MSPointerUp MSPointerCancel pointerup pointercancel",// : "mouseup",
			touchMoveEvent  =  "touchmove MSPointerMove MSPointerHover pointermove";// : "mousemove";


	$.event.special.ace_drag = {
		setup: function() {
			var min_threshold = 0;
		
			var $this = $(this);
			$this.on(touchStartEvent, function(event) {		
				var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] :
					event,
					start = {
						//time: Date.now(),
						coords: [ data.pageX, data.pageY ],
						origin: $(event.target)
					},
					stop;
					//start.origin.trigger({'type' : 'ace_dragStart', 'start':(start || [-1,-1])});
					
					var direction = false, dx = 0, dy = 0;

				function moveHandler(event) {
					if (!start) {
						return;
					}
					var data = event.originalEvent.touches ?
							event.originalEvent.touches[ 0 ] :
							event;
					stop = {
						coords: [ data.pageX, data.pageY ]
					};
					
					// prevent scrolling
					//if ( Math.abs(start.coords[1] - stop.coords[1]) > 0 || Math.abs(start.coords[0] - stop.coords[01]) > 0 ) {
						//event.preventDefault();
					//}


					if (start && stop) {
						dx = 0;
						dy = 0;

						direction = 
							(
							 Math.abs(dy = start.coords[ 1 ] - stop.coords[ 1 ]) > min_threshold
								&& 
							 Math.abs(dx = start.coords[ 0 ] - stop.coords[ 0 ]) <= Math.abs(dy)
							)
							? 
							(dy > 0 ? 'up' : 'down')
							:
							(
							 Math.abs(dx = start.coords[ 0 ] - stop.coords[ 0 ]) > min_threshold
								&& 
							 Math.abs( dy ) <= Math.abs(dx)
							)
							?
							(dx > 0 ? 'left' : 'right')
							:
							false;
							

							if( direction !== false ) {
							 var retval = {cancel: false}
							 start.origin.trigger({
								'type': 'ace_drag',
								//'start': start.coords,
								//'stop': stop.coords,
								'direction': direction,
								'dx': dx,
								'dy': dy,
								'retval': retval
							 })

		 					  // prevent document scrolling unless retval.cancel == true
							  if( retval.cancel == false ) event.preventDefault();
							}
					}
					start.coords[0] = stop.coords[0];
					start.coords[1] = stop.coords[1];
				}

				$this
				.on(touchMoveEvent, moveHandler)
				.one(touchStopEvent, function(event) {
					$this.off(touchMoveEvent, moveHandler);
					//start.origin.trigger({'type' : 'ace_dragEnd', 'stop':(stop || [-1,-1])});
					
					start = stop = undefined;
				
				});
			});
		}
	}

})(window.jQuery);

/**
 <b>Sidebar functions</b>. Collapsing/expanding, toggling mobile view menu and other sidebar functions.
*/

(function($ , undefined) {
	var sidebar_count = 0;

	function Sidebar(sidebar, settings) {
		var self = this;
		this.$sidebar = $(sidebar);
		this.$sidebar.attr('data-sidebar', 'true');
		if( !this.$sidebar.attr('id') ) this.$sidebar.attr( 'id' , 'id-sidebar-'+(++sidebar_count) )

		
		//get a list of 'data-*' attributes that override 'defaults' and 'settings'
		var attrib_values = ace.helper.getAttrSettings(sidebar, $.fn.ace_sidebar.defaults, 'sidebar-');
		this.settings = $.extend({}, $.fn.ace_sidebar.defaults, settings, attrib_values);


		//some vars
		this.minimized = false;//will be initiated later
		this.collapsible = false;//...
		this.horizontal = false;//...
		this.mobile_view = false;//


		this.vars = function() {
			return {'minimized': this.minimized, 'collapsible': this.collapsible, 'horizontal': this.horizontal, 'mobile_view': this.mobile_view}
		}
		this.get = function(name) {
			if(this.hasOwnProperty(name)) return this[name];
		}
		this.set = function(name, value) {
			if(this.hasOwnProperty(name)) this[name] = value;
		}
		

		this.ref = function() {
			//return a reference to self
			return this;
		}

		var toggleIcon = function(minimized) {
			var icon = $(this).find(ace.vars['.icon']), icon1, icon2;
			if(icon.length > 0) {
				icon1 = icon.attr('data-icon1');//the icon for expanded state
				icon2 = icon.attr('data-icon2');//the icon for collapsed state

				if(minimized !== undefined) {
					if(minimized) icon.removeClass(icon1).addClass(icon2);
					else icon.removeClass(icon2).addClass(icon1);
				}
				else {
					icon.toggleClass(icon1).toggleClass(icon2);
				}
			}
		}		
		
		var findToggleBtn = function() {
			var toggle_btn = self.$sidebar.find('.sidebar-collapse');
			if(toggle_btn.length == 0) toggle_btn = $('.sidebar-collapse[data-target="#'+(self.$sidebar.attr('id')||'')+'"]');
			if(toggle_btn.length != 0) toggle_btn = toggle_btn[0];
			else toggle_btn = null;
			
			return toggle_btn;
		}
		
		//collapse/expand button
		this.toggleMenu = function(toggle_btn, save) {
			if(this.collapsible) return;

			//var minimized = this.$sidebar.hasClass('menu-min');
			this.minimized = !this.minimized;
			
			try {
				//toggle_btn can also be a param to indicate saving to cookie or not?! if toggle_btn === false, it won't be saved
				ace.settings.sidebar_collapsed(sidebar, this.minimized, !(toggle_btn === false || save === false));//@ ace-extra.js
			} catch(e) {
				if(this.minimized)
					this.$sidebar.addClass('menu-min');
				else this.$sidebar.removeClass('menu-min');
			}
	
			if( !toggle_btn ) {
				toggle_btn = findToggleBtn();
			}
			if(toggle_btn) {
				toggleIcon.call(toggle_btn, this.minimized);
			}

			//force redraw for ie8
			if(ace.vars['old_ie']) ace.helper.redraw(sidebar);
		}
		this.collapse = function(toggle_btn, save) {
			if(this.collapsible) return;
			this.minimized = false;
			
			this.toggleMenu(toggle_btn, save);
		}
		this.expand = function(toggle_btn, save) {
			if(this.collapsible) return;
			this.minimized = true;
			
			this.toggleMenu(toggle_btn, save);
		}
		

		
		//collapse/expand in 2nd mobile style
		this.toggleResponsive = function(toggle_btn) {
			if(!this.mobile_view || this.mobile_style != 3) return;
		
			if( this.$sidebar.hasClass('menu-min') ) {
				//remove menu-min because it interferes with responsive-max
				this.$sidebar.removeClass('menu-min');
				var btn = findToggleBtn();
				if(btn) toggleIcon.call(btn);
			}


			this.minimized = !this.$sidebar.hasClass('responsive-min');
			this.$sidebar.toggleClass('responsive-min responsive-max');


			if( !toggle_btn ) {
				toggle_btn = this.$sidebar.find('.sidebar-expand');
				if(toggle_btn.length == 0) toggle_btn = $('.sidebar-expand[data-target="#'+(this.$sidebar.attr('id')||'')+'"]');
				if(toggle_btn.length != 0) toggle_btn = toggle_btn[0];
				else toggle_btn = null;
			}
			
			if(toggle_btn) {
				var icon = $(toggle_btn).find(ace.vars['.icon']), icon1, icon2;
				if(icon.length > 0) {
					icon1 = icon.attr('data-icon1');//the icon for expanded state
					icon2 = icon.attr('data-icon2');//the icon for collapsed state

					icon.toggleClass(icon1).toggleClass(icon2);
				}
			}

			$(document).triggerHandler('settings.ace', ['sidebar_collapsed' , this.minimized]);
		}
		
		//some helper functions
		this.is_collapsible = function() {
			var toggle
			return (this.$sidebar.hasClass('navbar-collapse'))
			&& ((toggle = $('.navbar-toggle[data-target="#'+(this.$sidebar.attr('id')||'')+'"]').get(0)) != null)
			&&  toggle.scrollHeight > 0
			//sidebar is collapsible and collapse button is visible?
		}
		this.is_mobile_view = function() {
			var toggle
			return ((toggle = $('.menu-toggler[data-target="#'+(this.$sidebar.attr('id')||'')+'"]').get(0)) != null)
			&&  toggle.scrollHeight > 0
		}


		//toggling submenu
		this.$sidebar.on(ace.click_event+'.ace.submenu', '.nav-list', function (ev) {
			var nav_list = this;

			//check to see if we have clicked on an element which is inside a .dropdown-toggle element?!
			//if so, it means we should toggle a submenu
			var link_element = $(ev.target).closest('a');
			if(!link_element || link_element.length == 0) return;//return if not clicked inside a link element

			var minimized  = self.minimized && !self.collapsible;
			//if .sidebar is .navbar-collapse and in small device mode, then let minimized be uneffective
	
			if( !link_element.hasClass('dropdown-toggle') ) {//it doesn't have a submenu return
				//just one thing before we return
				//if sidebar is collapsed(minimized) and we click on a first level menu item
				//and the click is on the icon, not on the menu text then let's cancel event and cancel navigation
				//Good for touch devices, that when the icon is tapped to see the menu text, navigation is cancelled
				//navigation is only done when menu text is tapped

				if( ace.click_event == 'tap'
					&&
					minimized
					&&
					link_element.get(0).parentNode.parentNode == nav_list )//only level-1 links
				{
					var text = link_element.find('.menu-text').get(0);
					if( text != null && ev.target != text && !$.contains(text , ev.target) ) {//not clicking on the text or its children
						ev.preventDefault();
						return false;
					}
				}


				//ios safari only has a bit of a problem not navigating to link address when scrolling down
				//specify data-link attribute to ignore this
				if(ace.vars['ios_safari'] && link_element.attr('data-link') !== 'false') {
					//only ios safari has a bit of a problem not navigating to link address when scrolling down
					//please see issues section in documentation
					document.location = link_element.attr('href');
					ev.preventDefault();
					return false;
				}

				return;
			}
			
			ev.preventDefault();
			
			


			var sub = link_element.siblings('.submenu').get(0);
			if(!sub) return false;
			var $sub = $(sub);

			var height_change = 0;//the amount of height change in .nav-list

			var parent_ul = sub.parentNode.parentNode;
			if
			(
				( minimized && parent_ul == nav_list )
				 || 
				( ( $sub.parent().hasClass('hover') && $sub.css('position') == 'absolute' ) && !self.collapsible )
			)
			{
				return false;
			}

			
			var sub_hidden = (sub.scrollHeight == 0)

			//if not open and visible, let's open it and make it visible
			if( sub_hidden ) {//being shown now
			  $(parent_ul).find('> .open > .submenu').each(function() {
				//close all other open submenus except for the active one
				if(this != sub && !$(this.parentNode).hasClass('active')) {
					height_change -= this.scrollHeight;
					self.hide(this, self.settings.duration, false);
				}
			  })
			}

			if( sub_hidden ) {//being shown now
				self.show(sub, self.settings.duration);
				//if a submenu is being shown and another one previously started to hide, then we may need to update/hide scrollbars
				//but if no previous submenu is being hidden, then no need to check if we need to hide the scrollbars in advance
				if(height_change != 0) height_change += sub.scrollHeight;//we need new updated 'scrollHeight' here
			} else {
				self.hide(sub, self.settings.duration);
				height_change -= sub.scrollHeight;
				//== -1 means submenu is being hidden
			}

			//hide scrollbars if content is going to be small enough that scrollbars is not needed anymore
			//do this almost before submenu hiding begins
			//but when minimized submenu's toggle should have no effect
			if (height_change != 0) {
				if(self.$sidebar.attr('data-sidebar-scroll') == 'true' && !self.minimized) 
					self.$sidebar.ace_sidebar_scroll('prehide', height_change)
			}

			return false;
		})

		var submenu_working = false;
		this.show = function(sub, $duration, shouldWait) {
			//'shouldWait' indicates whether to wait for previous transition (submenu toggle) to be complete or not?
			shouldWait = (shouldWait !== false);
			if(shouldWait && submenu_working) return false;
					
			var $sub = $(sub);
			var event;
			$sub.trigger(event = $.Event('show.ace.submenu'))
			if (event.isDefaultPrevented()) {
				return false;
			}
			
			if(shouldWait) submenu_working = true;


			$duration = $duration || this.settings.duration;
			
			$sub.css({
				height: 0,
				overflow: 'hidden',
				display: 'block'
			})
			.removeClass('nav-hide').addClass('nav-show')//only for window < @grid-float-breakpoint and .navbar-collapse.menu-min
			.parent().addClass('open');
			
			sub.scrollTop = 0;//this is for submenu_hover when sidebar is minimized and a submenu is scrollTop'ed using scrollbars ...

			if( $duration > 0 ) {
			  $sub.css({height: sub.scrollHeight,
				'transition-property': 'height',
				'transition-duration': ($duration/1000)+'s'})
			}

			var complete = function(ev, trigger) {
				ev && ev.stopPropagation();
				$sub
				.css({'transition-property': '', 'transition-duration': '', overflow:'', height: ''})
				//if(ace.vars['webkit']) ace.helper.redraw(sub);//little Chrome issue, force redraw ;)

				if(trigger !== false) $sub.trigger($.Event('shown.ace.submenu'))
				
				if(shouldWait) submenu_working = false;
			}
			
			if( $duration > 0 && !!$.support.transition.end ) {
			  $sub.one($.support.transition.end, complete);
			}
			else complete();
			
			//there is sometimes a glitch, so maybe retry
			if(ace.vars['android']) {
				setTimeout(function() {
					complete(null, false);
					ace.helper.redraw(sub);
				}, $duration + 20);
			}

			return true;
		 }
		 
		 
		 this.hide = function(sub, $duration, shouldWait) {
			//'shouldWait' indicates whether to wait for previous transition (submenu toggle) to be complete or not?
			shouldWait = (shouldWait !== false);
			if(shouldWait && submenu_working) return false;
		 
			
			var $sub = $(sub);
			var event;
			$sub.trigger(event = $.Event('hide.ace.submenu'))
			if (event.isDefaultPrevented()) {
				return false;
			}
			
			if(shouldWait) submenu_working = true;
			

			$duration = $duration || this.settings.duration;
			
			$sub.css({
				height: sub.scrollHeight,
				overflow: 'hidden',
				display: 'block'
			})
			.parent().removeClass('open');

			sub.offsetHeight;
			//forces the "sub" to re-consider the new 'height' before transition

			if( $duration > 0 ) {
			  $sub.css({'height': 0,
				'transition-property': 'height',
				'transition-duration': ($duration/1000)+'s'});
			}


			var complete = function(ev, trigger) {
				ev && ev.stopPropagation();
				$sub
				.css({display: 'none', overflow:'', height: '', 'transition-property': '', 'transition-duration': ''})
				.removeClass('nav-show').addClass('nav-hide')//only for window < @grid-float-breakpoint and .navbar-collapse.menu-min

				if(trigger !== false) $sub.trigger($.Event('hidden.ace.submenu'))
				
				if(shouldWait) submenu_working = false;
			}

			if( $duration > 0 && !!$.support.transition.end ) {
			   $sub.one($.support.transition.end, complete);
			}
			else complete();


			//there is sometimes a glitch, so maybe retry
			if(ace.vars['android']) {
				setTimeout(function() {
					complete(null, false);
					ace.helper.redraw(sub);
				}, $duration + 20);
			}

			return true;
		 }

		 this.toggle = function(sub, $duration) {
			$duration = $duration || self.settings.duration;
		 
			if( sub.scrollHeight == 0 ) {//if an element is hidden scrollHeight becomes 0
				if( this.show(sub, $duration) ) return 1;
			} else {
				if( this.hide(sub, $duration) ) return -1;
			}
			return 0;
		 }


		//sidebar vars
		var minimized_menu_class  = 'menu-min';
		var responsive_min_class  = 'responsive-min';
		var horizontal_menu_class = 'h-sidebar';

		var sidebar_mobile_style = function() {
			//differnet mobile menu styles
			this.mobile_style = 1;//default responsive mode with toggle button inside navbar
			if(this.$sidebar.hasClass('responsive') && !$('.menu-toggler[data-target="#'+this.$sidebar.attr('id')+'"]').hasClass('navbar-toggle')) this.mobile_style = 2;//toggle button behind sidebar
			 else if(this.$sidebar.hasClass(responsive_min_class)) this.mobile_style = 3;//minimized menu
			  else if(this.$sidebar.hasClass('navbar-collapse')) this.mobile_style = 4;//collapsible (bootstrap style)
		}
		sidebar_mobile_style.call(self);
		  
		function update_vars() {
			this.mobile_view = this.mobile_style < 4 && this.is_mobile_view();
			this.collapsible = !this.mobile_view && this.is_collapsible();

			this.minimized = 
			(!this.collapsible && this.$sidebar.hasClass(minimized_menu_class))
			 ||
			(this.mobile_style == 3 && this.mobile_view && this.$sidebar.hasClass(responsive_min_class))

			this.horizontal = !(this.mobile_view || this.collapsible) && this.$sidebar.hasClass(horizontal_menu_class)
		}

		//update some basic variables
		$(window).on('resize.sidebar.vars' , function(){
			update_vars.call(self);
		}).triggerHandler('resize.sidebar.vars')

	}//end of Sidebar
	

	//sidebar events
	
	//menu-toggler
	$(document)
	.on(ace.click_event+'.ace.menu', '.menu-toggler', function(e){
		var btn = $(this);
		var sidebar = $(btn.attr('data-target'));
		if(sidebar.length == 0) return;
		
		e.preventDefault();
				
		sidebar.toggleClass('display');
		btn.toggleClass('display');
		
		var click_event = ace.click_event+'.ace.autohide';
		var auto_hide = sidebar.attr('data-auto-hide') === 'true';

		if( btn.hasClass('display') ) {
			//hide menu if clicked outside of it!
			if(auto_hide) {
				$(document).on(click_event, function(ev) {
					if( sidebar.get(0) == ev.target || $.contains(sidebar.get(0), ev.target) ) {
						ev.stopPropagation();
						return;
					}

					sidebar.removeClass('display');
					btn.removeClass('display');
					$(document).off(click_event);
				})
			}

			if(sidebar.attr('data-sidebar-scroll') == 'true') sidebar.ace_sidebar_scroll('reset');
		}
		else {
			if(auto_hide) $(document).off(click_event);
		}

		return false;
	})
	//sidebar collapse/expand button
	.on(ace.click_event+'.ace.menu', '.sidebar-collapse', function(e){
		
		var target = $(this).attr('data-target'), $sidebar = null;
		if(target) $sidebar = $(target);
		if($sidebar == null || $sidebar.length == 0) $sidebar = $(this).closest('.sidebar');
		if($sidebar.length == 0) return;

		e.preventDefault();
		$sidebar.ace_sidebar('toggleMenu', this);
	})
	//this button is used in `mobile_style = 3` responsive menu style to expand minimized sidebar
	.on(ace.click_event+'.ace.menu', '.sidebar-expand', function(e){
		var target = $(this).attr('data-target'), $sidebar = null;
		if(target) $sidebar = $(target);
		if($sidebar == null || $sidebar.length == 0) $sidebar = $(this).closest('.sidebar');
		if($sidebar.length == 0) return;	
	
		var btn = this;
		e.preventDefault();
		$sidebar.ace_sidebar('toggleResponsive', this);
		
		var click_event = ace.click_event+'.ace.autohide';
		if($sidebar.attr('data-auto-hide') === 'true') {
			if( $sidebar.hasClass('responsive-max') ) {
				$(document).on(click_event, function(ev) {
					if( $sidebar.get(0) == ev.target || $.contains($sidebar.get(0), ev.target) ) {
						ev.stopPropagation();
						return;
					}

					$sidebar.ace_sidebar('toggleResponsive', btn);
					$(document).off(click_event);
				})
			}
			else {
				$(document).off(click_event);
			}
		}
	})

	
	$.fn.ace_sidebar = function (option, value) {
		var method_call;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_sidebar');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_sidebar', (data = new Sidebar(this, options)));
			if (typeof option === 'string' && typeof data[option] === 'function') {
				if(value instanceof Array) method_call = data[option].apply(data, value);
				else method_call = data[option](value);
			}
		});

		return (method_call === undefined) ? $set : method_call;
	};
	
	
	$.fn.ace_sidebar.defaults = {
		'duration': 300
    }


})(window.jQuery);


/**
 <b>Scrollbars for sidebar</b>. This approach can <span class="text-danger">only</span> be used on <u>fixed</u> sidebar.
 It doesn't use <u>"overflow:hidden"</u> CSS property and therefore can be used with <u>.hover</u> submenus and minimized sidebar.
 Except when in mobile view and menu toggle button is not in the navbar.
*/

(function($ , undefined) {
	//if( !$.fn.ace_scroll ) return;

	var old_safari = ace.vars['safari'] && navigator.userAgent.match(/version\/[1-5]/i)
	//NOTE
	//Safari on windows has not been updated for a long time.
	//And it has a problem when sidebar is fixed & scrollable and there is a CSS3 animation inside page content.
	//Very probably windows users of safari have migrated to another browser by now!

	var is_element_pos =
	'getComputedStyle' in window ?
	//el.offsetHeight is used to force redraw and recalculate 'el.style.position' esp. for webkit!
	function(el, pos) { el.offsetHeight; return window.getComputedStyle(el).position == pos }
	:
	function(el, pos) { el.offsetHeight; return $(el).css('position') == pos }
	
		
	function Sidebar_Scroll(sidebar , settings) {
		var self = this;

		var $window = $(window);
		var $sidebar = $(sidebar),
			$nav = $sidebar.find('.nav-list'),
			$toggle = $sidebar.find('.sidebar-toggle').eq(0),
			$shortcuts = $sidebar.find('.sidebar-shortcuts').eq(0);
			
		var nav = $nav.get(0);
		if(!nav) return;
		
		
		var attrib_values = ace.helper.getAttrSettings(sidebar, $.fn.ace_sidebar_scroll.defaults);
		this.settings = $.extend({}, $.fn.ace_sidebar_scroll.defaults, settings, attrib_values);
		var scroll_to_active = self.settings.scroll_to_active;
	
	
		var ace_sidebar = $sidebar.ace_sidebar('ref');
		$sidebar.attr('data-sidebar-scroll', 'true');
			
		
		var scroll_div = null,
			scroll_content = null,
			scroll_content_div = null,
			bar = null,
			track = null,
			ace_scroll = null;


		this.is_scrolling = false;
		var _initiated = false;
		this.sidebar_fixed = is_element_pos(sidebar, 'fixed');
		
		var $avail_height, $content_height;

		
		var available_height = function() {
			//available window space
			var offset = $nav.parent().offset();//because `$nav.offset()` considers the "scrolled top" amount as well
			if(self.sidebar_fixed) offset.top -= ace.helper.scrollTop();

			return $window.innerHeight() - offset.top - ( self.settings.include_toggle ? 0 : $toggle.outerHeight() );
		}
		var content_height = function() {
			return nav.clientHeight;//we don't use nav.scrollHeight here, because hover submenus are considered in calculating scrollHeight despite position=absolute!
		}

		
		
		var initiate = function(on_page_load) {
			if( _initiated ) return;
			if( !self.sidebar_fixed ) return;//eligible??
			//return if we want scrollbars only on "fixed" sidebar and sidebar is not "fixed" yet!

			//initiate once
			$nav.wrap('<div class="nav-wrap-up pos-rel" />');
			$nav.after('<div><div></div></div>');

			$nav.wrap('<div class="nav-wrap" />');
			if(!self.settings.include_toggle) $toggle.css({'z-index': 1});
			if(!self.settings.include_shortcuts) $shortcuts.css({'z-index': 99});

			scroll_div = $nav.parent().next()
			.ace_scroll({
				size: available_height(),
				//reset: true,
				mouseWheelLock: true,
				hoverReset: false,
				dragEvent: true,
				styleClass: self.settings.scroll_style,
				touchDrag: false//disable touch drag event on scrollbars, we'll add a custom one later
			})
			.closest('.ace-scroll').addClass('nav-scroll');
			
			ace_scroll = scroll_div.data('ace_scroll');

			scroll_content = scroll_div.find('.scroll-content').eq(0);
			scroll_content_div = scroll_content.find(' > div').eq(0);
			
			track = $(ace_scroll.get_track());
			bar = track.find('.scroll-bar').eq(0);

			if(self.settings.include_shortcuts && $shortcuts.length != 0) {
				$nav.parent().prepend($shortcuts).wrapInner('<div />');
				$nav = $nav.parent();
			}
			if(self.settings.include_toggle && $toggle.length != 0) {
				$nav.append($toggle);
				$nav.closest('.nav-wrap').addClass('nav-wrap-t');//it just helps to remove toggle button's top border and restore li:last-child's bottom border
			}

			$nav.css({position: 'relative'});
			if( self.settings.scroll_outside == true ) scroll_div.addClass('scrollout');
			
			nav = $nav.get(0);
			nav.style.top = 0;
			scroll_content.on('scroll.nav', function() {
				nav.style.top = (-1 * this.scrollTop) + 'px';
			});
			
			//mousewheel library available?
			$nav.on(!!$.event.special.mousewheel ? 'mousewheel.ace_scroll' : 'mousewheel.ace_scroll DOMMouseScroll.ace_scroll', function(event){
				if( !self.is_scrolling || !ace_scroll.is_active() ) {
					return !self.settings.lock_anyway;
				}
				//transfer $nav's mousewheel event to scrollbars
				return scroll_div.trigger(event);
			});
			
			$nav.on('mouseenter.ace_scroll', function() {
				track.addClass('scroll-hover');
			}).on('mouseleave.ace_scroll', function() {
				track.removeClass('scroll-hover');
			});


			/**
			$(document.body).on('touchmove.nav', function(event) {
				if( self.is_scrolling && $.contains(sidebar, event.target) ) {
					event.preventDefault();
					return false;
				}
			})
			*/

			//you can also use swipe event in a similar way //swipe.nav
			var content = scroll_content.get(0);
			$nav.on('ace_drag.nav', function(event) {
				if( !self.is_scrolling || !ace_scroll.is_active() ) {
					event.retval.cancel = true;
					return;
				}
				
				//if submenu hover is being scrolled let's cancel sidebar scroll!
				if( $(event.target).closest('.can-scroll').length != 0 ) {
					event.retval.cancel = true;
					return;
				}

				if(event.direction == 'up' || event.direction == 'down') {
					
					ace_scroll.move_bar(true);
					
					var distance = event.dy;
					
					distance = parseInt(Math.min($avail_height, distance))
					if(Math.abs(distance) > 2) distance = distance * 2;
					
					if(distance != 0) {
						content.scrollTop = content.scrollTop + distance;
						nav.style.top = (-1 * content.scrollTop) + 'px';
					}
				}
			});
			

			//for drag only
			if(self.settings.smooth_scroll) {
				$nav
				.on('touchstart.nav MSPointerDown.nav pointerdown.nav', function(event) {
					$nav.css('transition-property', 'none');
					bar.css('transition-property', 'none');
				})
				.on('touchend.nav touchcancel.nav MSPointerUp.nav MSPointerCancel.nav pointerup.nav pointercancel.nav', function(event) {
					$nav.css('transition-property', 'top');
					bar.css('transition-property', 'top');
				});
			}
			
			

			if(old_safari && !self.settings.include_toggle) {
				var toggle = $toggle.get(0);
				if(toggle) scroll_content.on('scroll.safari', function() {
					ace.helper.redraw(toggle);
				});
			}

			_initiated = true;

			//if the active item is not visible, scroll down so that it becomes visible
			//only the first time, on page load
			if(on_page_load == true) {
				self.reset();//try resetting at first

				if( scroll_to_active ) {
					self.scroll_to_active();
				}
				scroll_to_active = false;
			}
			
			
			
			if( typeof self.settings.smooth_scroll === 'number' && self.settings.smooth_scroll > 0) {
				$nav.css({'transition-property': 'top', 'transition-duration': (self.settings.smooth_scroll / 1000).toFixed(2)+'s'})
				bar.css({'transition-property': 'top', 'transition-duration': (self.settings.smooth_scroll / 1500).toFixed(2)+'s'})
				
				scroll_div
				.on('drag.start', function(e) {
					e.stopPropagation();
					$nav.css('transition-property', 'none')
				})
				.on('drag.end', function(e) {
					e.stopPropagation();
					$nav.css('transition-property', 'top')
				});
			}
			
			if(ace.vars['android']) {
				//force hide address bar, because its changes don't trigger window resize and become kinda ugly
				var val = ace.helper.scrollTop();
				if(val < 2) {
					window.scrollTo( val, 0 );
					setTimeout( function() {
						self.reset();
					}, 20 );
				}
				
				var last_height = ace.helper.winHeight() , new_height;
				$(window).on('scroll.ace_scroll', function() {
					if(self.is_scrolling && ace_scroll.is_active()) {
						new_height = ace.helper.winHeight();
						if(new_height != last_height) {
							last_height = new_height;
							self.reset();
						}
					}
				});
			}
		}
		
		
		
		
		this.scroll_to_active = function() {
			if( !ace_scroll || !ace_scroll.is_active() ) return;
			try {
				//sometimes there's no active item or not 'offsetTop' property
				var $active;
				
				var vars = ace_sidebar['vars']()

				var nav_list = $sidebar.find('.nav-list')
				if(vars['minimized'] && !vars['collapsible']) {
					$active = nav_list.find('> .active')
				}
				else {
					$active = $nav.find('> .active.hover')
					if($active.length == 0)	$active = $nav.find('.active:not(.open)')
				}

			
				var top = $active.outerHeight();
				nav_list = nav_list.get(0);
				var active = $active.get(0);
				while(active != nav_list) {
					top += active.offsetTop;
					active = active.parentNode;
				}

				var scroll_amount = top - scroll_div.height();
				if(scroll_amount > 0) {
					nav.style.top = -scroll_amount + 'px';
					scroll_content.scrollTop(scroll_amount);
				}
			}catch(e){}
		}
		
		
		
		this.reset = function(recalc) {
			if(recalc === true) {
				this.sidebar_fixed = is_element_pos(sidebar, 'fixed');
			}
			
			if( !this.sidebar_fixed ) {
				this.disable();
				return;//eligible??
			}

			//return if we want scrollbars only on "fixed" sidebar and sidebar is not "fixed" yet!

			if( !_initiated ) initiate();
			//initiate scrollbars if not yet
			
			var vars = ace_sidebar['vars']();
			

			//enable if:
			//menu is not collapsible mode (responsive navbar-collapse mode which has default browser scrollbar)
			//menu is not horizontal or horizontal but mobile view (which is not navbar-collapse)
			//and available height is less than nav's height
			

			var enable_scroll = !vars['collapsible'] && !vars['horizontal']
								&& ($avail_height = available_height()) < ($content_height = nav.clientHeight);
								//we don't use nav.scrollHeight here, because hover submenus are considered in calculating scrollHeight despite position=absolute!

								
			this.is_scrolling = true;
			if( enable_scroll ) {
				scroll_content_div.css({height: $content_height, width: 8});
				scroll_div.prev().css({'max-height' : $avail_height})
				ace_scroll.update({size: $avail_height})
				ace_scroll.enable();
				ace_scroll.reset();
			}
			if( !enable_scroll || !ace_scroll.is_active() ) {
				if(this.is_scrolling) this.disable();
			}
			else {
				$sidebar.addClass('sidebar-scroll');
			}
			
			//return this.is_scrolling;
		}
		
		
		
		this.disable = function() {
			this.is_scrolling = false;
			if(scroll_div) {
				scroll_div.css({'height' : '', 'max-height' : ''});
				scroll_content_div.css({height: '', width: ''});//otherwise it will have height and takes up some space even when invisible
				scroll_div.prev().css({'max-height' : ''})
				ace_scroll.disable();
			}

			if(parseInt(nav.style.top) < 0 && self.settings.smooth_scroll && $.support.transition.end) {
				$nav.one($.support.transition.end, function() {
					$sidebar.removeClass('sidebar-scroll');
					$nav.off('.trans');
				});
			} else {
				$sidebar.removeClass('sidebar-scroll');
			}

			nav.style.top = 0;
		}
		
		this.prehide = function(height_change) {
			if(!this.is_scrolling || ace_sidebar.get('minimized')) return;//when minimized submenu's toggle should have no effect
			
			if(content_height() + height_change < available_height()) {
				this.disable();
			}
			else if(height_change < 0) {
				//if content height is decreasing
				//let's move nav down while a submenu is being hidden
				var scroll_top = scroll_content.scrollTop() + height_change
				if(scroll_top < 0) return;

				nav.style.top = (-1 * scroll_top) + 'px';
			}
		}
		
		
		this._reset = function(recalc) {
			if(recalc === true) {
				this.sidebar_fixed = is_element_pos(sidebar, 'fixed');
			}
			
			if(ace.vars['webkit']) 
				setTimeout(function() { self.reset() } , 0);
			else this.reset();
		}
		
		
		this.set_hover = function() {
			if(track) track.addClass('scroll-hover');
		}
		
		this.get = function(name) {
			if(this.hasOwnProperty(name)) return this[name];
		}
		this.set = function(name, value) {
			if(this.hasOwnProperty(name)) this[name] = value;
		}
		this.ref = function() {
			//return a reference to self
			return this;
		}
		
		this.updateStyle = function(styleClass) {
			if(ace_scroll == null) return;
			ace_scroll.update({styleClass: styleClass});
		}

		
		//change scrollbar size after a submenu is hidden/shown
		//but don't change if sidebar is minimized
		$sidebar.on('hidden.ace.submenu.sidebar_scroll shown.ace.submenu.sidebar_scroll', '.submenu', function(e) {
			e.stopPropagation();

			if( !ace_sidebar.get('minimized') ) {
				//webkit has a little bit of a glitch!!!
				self._reset();
				if( e.type == 'shown' ) self.set_hover();
			}
		});

		
		initiate(true);//true = on_page_load
	}
	

	
	//reset on document and window changes
	$(document).on('settings.ace.sidebar_scroll', function(ev, event_name, event_val){
		$('.sidebar[data-sidebar-scroll=true]').each(function() {
			var $this = $(this);
			var sidebar_scroll = $this.ace_sidebar_scroll('ref');

			if( event_name == 'sidebar_collapsed' && is_element_pos(this, 'fixed') ) {
				if( $this.attr('data-sidebar-hover') == 'true' ) $this.ace_sidebar_hover('reset');
				sidebar_scroll._reset();
			}
			else if( event_name === 'sidebar_fixed' || event_name === 'navbar_fixed' ) {
				var is_scrolling = sidebar_scroll.get('is_scrolling');
				var sidebar_fixed = is_element_pos(this, 'fixed')
				sidebar_scroll.set('sidebar_fixed', sidebar_fixed);

				if(sidebar_fixed && !is_scrolling) {
					sidebar_scroll._reset();
				}
				else if( !sidebar_fixed ) {
					sidebar_scroll.disable();
				}
			}
		
		});
	});
	
	$(window).on('resize.ace.sidebar_scroll', function(){
		$('.sidebar[data-sidebar-scroll=true]').each(function() {
			var $this = $(this);
			if( $this.attr('data-sidebar-hover') == 'true' ) $this.ace_sidebar_hover('reset');
			/////////////
			var sidebar_scroll = $(this).ace_sidebar_scroll('ref');
			
			var sidebar_fixed = is_element_pos(this, 'fixed')
			sidebar_scroll.set('sidebar_fixed', sidebar_fixed);
			sidebar_scroll._reset();
		});
	})
	

	
	
	 /////////////////////////////////////////////
	 if(!$.fn.ace_sidebar_scroll) {
	  $.fn.ace_sidebar_scroll = function (option, value) {
		var method_call;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_sidebar_scroll');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_sidebar_scroll', (data = new Sidebar_Scroll(this, options)));
			if (typeof option === 'string' && typeof data[option] === 'function') {
				method_call = data[option](value);
			}
		});

		return (method_call === undefined) ? $set : method_call;
	 }
	 
	 
	 $.fn.ace_sidebar_scroll.defaults = {
		'scroll_to_active': true,
		'include_shortcuts': true,
		'include_toggle': false,
		'smooth_scroll': 150,
		'scroll_outside': false,
		'scroll_style': '',
		'lock_anyway': false
     }
	 
	}

})(window.jQuery);

/**
 <b>Submenu hover adjustment</b>. Automatically move up a submenu to fit into screen when some part of it goes beneath window.
 Pass a "true" value as an argument and submenu will have native browser scrollbars when necessary.
*/

(function($ , undefined) {

 if( ace.vars['very_old_ie'] ) return;
 //ignore IE7 & below
 
 var hasTouch = ace.vars['touch'];
 var nativeScroll = ace.vars['old_ie'] || hasTouch;
 

 var is_element_pos =
	'getComputedStyle' in window ?
	//el.offsetHeight is used to force redraw and recalculate 'el.style.position' esp. for webkit!
	function(el, pos) { el.offsetHeight; return window.getComputedStyle(el).position == pos }
	:
	function(el, pos) { el.offsetHeight; return $(el).css('position') == pos }



 $(window).on('resize.sidebar.ace_hover', function() {
	$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('update_vars').ace_sidebar_hover('reset');
 })

 $(document).on('settings.ace.ace_hover', function(e, event_name, event_val) {
	if(event_name == 'sidebar_collapsed') $('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('reset');
	else if(event_name == 'navbar_fixed') $('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('update_vars');
 })
 
 var sidebars = [];

 function Sidebar_Hover(sidebar , settings) {
	var self = this, that = this;
	
	var attrib_values = ace.helper.getAttrSettings(sidebar, $.fn.ace_sidebar_hover.defaults);
	this.settings = $.extend({}, $.fn.ace_sidebar_hover.defaults, settings, attrib_values);
	

	var $sidebar = $(sidebar), nav_list = $sidebar.find('.nav-list').get(0);
	$sidebar.attr('data-sidebar-hover', 'true');
	
	sidebars.push($sidebar);

	var sidebar_vars = {};
	var old_ie = ace.vars['old_ie'];

	
	
	var scroll_right = false;
	//scroll style class
	
	if(hasTouch) self.settings.sub_hover_delay = parseInt(Math.max(self.settings.sub_hover_delay, 2500));//for touch device, delay is at least 2.5sec

	var $window = $(window);
	//navbar used for adding extra offset from top when adjusting submenu
	var $navbar = $('.navbar').eq(0);
	var navbar_fixed = $navbar.css('position') == 'fixed';
	this.update_vars = function() {
		navbar_fixed = $navbar.css('position') == 'fixed';
	}

	self.dirty = false;
	//on window resize or sidebar expand/collapse a previously "pulled up" submenu should be reset back to its default position
	//for example if "pulled up" in "responsive-min" mode, in "fullmode" should not remain "pulled up"
	this.reset = function() {
		if( self.dirty == false ) return;
		self.dirty = false;//so don't reset is not called multiple times in a row!
	
		$sidebar.find('.submenu').each(function() {
			var $sub = $(this), li = $sub.parent();
			$sub.css({'top': '', 'bottom': '', 'max-height': ''});
			
			if($sub.hasClass('ace-scroll')) {
				$sub.ace_scroll('disable');
			}
			else {
				$sub.removeClass('sub-scroll');
			}
			 
			if( is_element_pos(this, 'absolute') ) $sub.addClass('can-scroll');
			else $sub.removeClass('can-scroll');

			li.removeClass('pull_up').find('.menu-text:first').css('margin-top', '');
		})

		$sidebar.find('.hover-show').removeClass('hover-show hover-shown hover-flip');
	}
	
	this.updateStyle = function(newStyle) {
		sub_scroll_style = newStyle;
		$sidebar.find('.submenu.ace-scroll').ace_scroll('update', {styleClass: newStyle});
	}
	this.changeDir = function(dir) {
		scroll_right = (dir === 'right');
	}
	
	
	//update submenu scrollbars on submenu hide & show

	var lastScrollHeight = -1;
	//hide scrollbars if it's going to be not needed anymore!
	if(!nativeScroll)
	$sidebar.on('hide.ace.submenu.sidebar_hover', '.submenu', function(e) {
		if(lastScrollHeight < 1) return;

		e.stopPropagation();
		var $sub = $(this).closest('.ace-scroll.can-scroll');
		if($sub.length == 0 || !is_element_pos($sub[0], 'absolute')) return;

		if($sub[0].scrollHeight - this.scrollHeight < lastScrollHeight) {
			$sub.ace_scroll('disable');
		}
	});

	
	
	
	//reset scrollbars 
	if(!nativeScroll)
	$sidebar.on('shown.ace.submenu.sidebar_hover hidden.ace.submenu.sidebar_hover', '.submenu', function(e) {
		if(lastScrollHeight < 1) return;
	
		var $sub = $(this).closest('.ace-scroll.can-scroll');
		if($sub.length == 0 || !is_element_pos($sub[0], 'absolute') ) return;
		
		var sub_h = $sub[0].scrollHeight;
		
		if(lastScrollHeight > 14 && sub_h - lastScrollHeight > 4) {
			$sub.ace_scroll('enable').ace_scroll('reset');//don't update track position
		}
		else {
			$sub.ace_scroll('disable');
		}
	});


	///////////////////////


	var currentScroll = -1;

	//some mobile browsers don't have mouseenter
	var event_1 = !hasTouch ? 'mouseenter.sub_hover' : 'touchstart.sub_hover';// pointerdown.sub_hover';
	var event_2 = !hasTouch ? 'mouseleave.sub_hover' : 'touchend.sub_hover touchcancel.sub_hover';// pointerup.sub_hover pointercancel.sub_hover';
	
	$sidebar.on(event_1, '.nav-list li, .sidebar-shortcuts', function (e) {
		sidebar_vars = $sidebar.ace_sidebar('vars');
		
	
		//ignore if collapsible mode (mobile view .navbar-collapse) so it doesn't trigger submenu movements
		//or return if horizontal but not mobile_view (style 1&3)
		if( sidebar_vars['collapsible'] /**|| sidebar_vars['horizontal']*/ ) return;
		
		var $this = $(this);

		var shortcuts = false;
		var has_hover = $this.hasClass('hover');
		
		var sub = $this.find('> .submenu').get(0);
		if( !(sub || ((this.parentNode == nav_list || has_hover || (shortcuts = $this.hasClass('sidebar-shortcuts'))) /**&& sidebar_vars['minimized']*/)) ) {
			if(sub) $(sub).removeClass('can-scroll');
			return;//include .compact and .hover state as well?
		}
		
		var target_element = sub, is_abs = false;
		if( !target_element && this.parentNode == nav_list ) target_element = $this.find('> a > .menu-text').get(0);
		if( !target_element && shortcuts ) target_element = $this.find('.sidebar-shortcuts-large').get(0);
		if( (!target_element || !(is_abs = is_element_pos(target_element, 'absolute'))) && !has_hover ) {
			if(sub) $(sub).removeClass('can-scroll');
			return;
		}
		
		
		var sub_hide = getSubHide(this);
		//var show_sub = false;

		if(sub) {
		 if(is_abs) {
			self.dirty = true;
			
			var newScroll = ace.helper.scrollTop();
			//if submenu is becoming visible for first time or document has been scrolled, then adjust menu
			if( !sub_hide.is_visible() || (!hasTouch && newScroll != currentScroll) || old_ie ) {
				//try to move/adjust submenu if the parent is a li.hover or if submenu is minimized
				//if( is_element_pos(sub, 'absolute') ) {//for example in small device .hover > .submenu may not be absolute anymore!
					$(sub).addClass('can-scroll');
					//show_sub = true;
					if(!old_ie && !hasTouch) adjust_submenu.call(this, sub);
					else {
						//because ie8 needs some time for submenu to be displayed and real value of sub.scrollHeight be kicked in
						var that = this;
						setTimeout(function() {	adjust_submenu.call(that, sub) }, 0)
					}
				//}
				//else $(sub).removeClass('can-scroll');
			}
			currentScroll = newScroll;
		 }
		 else {
			$(sub).removeClass('can-scroll');
		 }
		}
		//if(show_sub) 
		sub_hide.show();
		
	 }).on(event_2, '.nav-list li, .sidebar-shortcuts', function (e) {
		sidebar_vars = $sidebar.ace_sidebar('vars');
		
		if( sidebar_vars['collapsible'] /**|| sidebar_vars['horizontal']*/ ) return;

		if( !$(this).hasClass('hover-show') ) return;

		getSubHide(this).hideDelay();
	 });
	 
	
	function subHide(li_sub) {
		var self = li_sub, $self = $(self);
		var timer = null;
		var visible = false;
		
		this.show = function() {
			if(timer != null) clearTimeout(timer);
			timer = null;		

			$self.addClass('hover-show hover-shown');
			visible = true;

			//let's hide .hover-show elements that are not .hover-shown anymore (i.e. marked for hiding in hideDelay)
			for(var i = 0; i < sidebars.length ; i++)
			{
			  sidebars[i].find('.hover-show').not('.hover-shown').each(function() {
				getSubHide(this).hide();
			  })
			}
		}
		
		this.hide = function() {
			visible = false;
			
			$self.removeClass('hover-show hover-shown hover-flip');
			
			if(timer != null) clearTimeout(timer);
			timer = null;
			
			var sub = $self.find('> .submenu').get(0);
			if(sub) getSubScroll(sub, 'hide');
		}
		
		this.hideDelay = function(callback) {
			if(timer != null) clearTimeout(timer);
			
			$self.removeClass('hover-shown');//somehow marked for hiding
			
			timer = setTimeout(function() {
				visible = false;
				$self.removeClass('hover-show hover-flip');
				timer = null;
				
				var sub = $self.find('> .submenu').get(0);
				if(sub) getSubScroll(sub, 'hide');
				
				if(typeof callback === 'function') callback.call(this);
			}, that.settings.sub_hover_delay);
		}
		
		this.is_visible = function() {
			return visible;
		}
	}
	function getSubHide(el) {
		var sub_hide = $(el).data('subHide');
		if(!sub_hide) $(el).data('subHide', (sub_hide = new subHide(el)));
		return sub_hide;
	}
	
	
	function getSubScroll(el, func) {
		var sub_scroll = $(el).data('ace_scroll');
		if(!sub_scroll) return false;
		if(typeof func === 'string') {
			sub_scroll[func]();
			return true;
		}
		return sub_scroll;
	}	
	
	function adjust_submenu(sub) {
		var $li = $(this);
		var $sub = $(sub);
		sub.style.top = '';
		sub.style.bottom = '';


		var menu_text = null
		if( sidebar_vars['minimized'] && (menu_text = $li.find('.menu-text').get(0)) ) {
			//2nd level items don't have .menu-text
			menu_text.style.marginTop = '';
		}

		var scroll = ace.helper.scrollTop();
		var navbar_height = 0;

		var $scroll = scroll;
		
		if( navbar_fixed ) {
			navbar_height = sidebar.offsetTop;//$navbar.height();
			$scroll += navbar_height + 1;
			//let's avoid our submenu from going below navbar
			//because of chrome z-index stacking issue and firefox's normal .submenu over fixed .navbar flicker issue
		}




		var off = $li.offset();
		off.top = parseInt(off.top);
		
		var extra = 0, parent_height;
		
		sub.style.maxHeight = '';//otherwise scrollHeight won't be consistent in consecutive calls!?
		var sub_h = sub.scrollHeight;
		var parent_height = $li.height();
		if(menu_text) {
			extra = parent_height;
			off.top += extra;
		}
		var sub_bottom = parseInt(off.top + sub_h)

		var move_up = 0;
		var winh = $window.height();


		//if the bottom of menu is going to go below visible window

		var top_space = parseInt(off.top - $scroll - extra);//available space on top
		var win_space = winh;//available window space
		
		var horizontal = sidebar_vars['horizontal'], horizontal_sub = false;
		if(horizontal && this.parentNode == nav_list) {
			move_up = 0;//don't move up first level submenu in horizontal mode
			off.top += $li.height();
			horizontal_sub = true;//first level submenu
		}

		if(!horizontal_sub && (move_up = (sub_bottom - (winh + scroll))) >= 0 ) {
			//don't move up more than available space
			move_up = move_up < top_space ? move_up : top_space;

			//move it up a bit more if there's empty space
			if(move_up == 0) move_up = 20;
			if(top_space - move_up > 10) {
				move_up += parseInt(Math.min(25, top_space - move_up));
			}


			//move it down if submenu's bottom is going above parent LI
			if(off.top + (parent_height - extra) > (sub_bottom - move_up)) {
				move_up -= (off.top + (parent_height - extra) - (sub_bottom - move_up));
			}

			if(move_up > 0) {
				sub.style.top = -(move_up) + 'px';
				if( menu_text ) {
					menu_text.style.marginTop = -(move_up) + 'px';
				}
			}
		}
		if(move_up < 0) move_up = 0;//when it goes below
		
		var pull_up = move_up > 0 && move_up > parent_height - 20;
		if(pull_up) {
			$li.addClass('pull_up');
		}
		else $li.removeClass('pull_up');
		
		
		//flip submenu if out of window width
		if(horizontal) {
			if($li.parent().parent().hasClass('hover-flip')) $li.addClass('hover-flip');//if a parent is already flipped, flip it then!
			else {
				var sub_off = $sub.offset();
				var sub_w = $sub.width();
				var win_w = $window.width();
				if(sub_off.left + sub_w > win_w) {
					$li.addClass('hover-flip');
				}
			}
		}


		//don't add scrollbars if it contains .hover menus
		var has_hover = $li.hasClass('hover') && !sidebar_vars['mobile_view'];
		if(has_hover && $sub.find('> li > .submenu').length > 0) return;

	
		//if(  ) {
			var scroll_height = (win_space - (off.top - scroll)) + (move_up);
			//if after scroll, the submenu is above parent LI, then move it down
			var tmp = move_up - scroll_height;
			if(tmp > 0 && tmp < parent_height) scroll_height += parseInt(Math.max(parent_height, parent_height - tmp));

			scroll_height -= 5;
			
			if(scroll_height < 90) {
				return;
			}
			
			var ace_scroll = false;
			if(!nativeScroll) {
				ace_scroll = getSubScroll(sub);
				if(ace_scroll == false) {
					$sub.ace_scroll({
						//hideOnIdle: true,
						observeContent: true,
						detached: true,
						updatePos: false,
						reset: true,
						mouseWheelLock: true,
						styleClass: self.settings.sub_scroll_style
					});
					ace_scroll = getSubScroll(sub);
					
					var track = ace_scroll.get_track();
					if(track) {
						//detach it from body and insert it after submenu for better and cosistent positioning
						$sub.after(track);
					}
				}
				
				ace_scroll.update({size: scroll_height});
			}
			else {
				$sub
				.addClass('sub-scroll')
				.css('max-height', (scroll_height)+'px')
			}


			lastScrollHeight = scroll_height;
			if(!nativeScroll && ace_scroll) {
				if(scroll_height > 14 && sub_h - scroll_height > 4) {
					ace_scroll.enable()
					ace_scroll.reset();
				}			
				else {
					ace_scroll.disable();
				}

				//////////////////////////////////
				var track = ace_scroll.get_track();
				if(track) {
					track.style.top = -(move_up - extra - 1) + 'px';
					
					var off = $sub.position();
					var left = off.left 
					if( !scroll_right ) {
						left += ($sub.outerWidth() - ace_scroll.track_size());
					}
					else {
						left += 2;
					}
					track.style.left = parseInt(left) + 'px';
					
					if(horizontal_sub) {//first level submenu
						track.style.left = parseInt(left - 2) + 'px';
						track.style.top = parseInt(off.top) + (menu_text ? extra - 2 : 0) + 'px';
					}
				}
			}
		//}


		//again force redraw for safari!
		if( ace.vars['safari'] ) {
			ace.helper.redraw(sub)
		}
   }

}
 
 
 
 /////////////////////////////////////////////
 $.fn.ace_sidebar_hover = function (option, value) {
	var method_call;

	var $set = this.each(function () {
		var $this = $(this);
		var data = $this.data('ace_sidebar_hover');
		var options = typeof option === 'object' && option;

		if (!data) $this.data('ace_sidebar_hover', (data = new Sidebar_Hover(this, options)));
		if (typeof option === 'string' && typeof data[option] === 'function') {
			method_call = data[option](value);
		}
	});

	return (method_call === undefined) ? $set : method_call;
 }
 
  $.fn.ace_sidebar_hover.defaults = {
	'sub_sub_hover_delay': 750,
	'sub_scroll_style': 'no-track scroll-thin'
 }
 

})(window.jQuery);



/**
 <b>Widget boxes</b>
*/
(function($ , undefined) {

	var Widget_Box = function(box, options) {
		this.$box = $(box);
		var that = this;
		//this.options = $.extend({}, $.fn.widget_box.defaults, options);

		this.reload = function() {
			var $box = this.$box;
			var $remove_position = false;
			if($box.css('position') == 'static') {
				$remove_position = true;
				$box.addClass('position-relative');
			}
			$box.append('<div class="widget-box-overlay"><i class="'+ ace.vars['icon'] + 'loading-icon fa fa-spinner fa-spin fa-2x white"></i></div>');

			$box.one('reloaded.ace.widget', function() {
				$box.find('.widget-box-overlay').remove();
				if($remove_position) $box.removeClass('position-relative');
			});
		}

		this.close = function() {
			var $box = this.$box;
			var closeSpeed = 300;
			$box.fadeOut(closeSpeed , function(){
					$box.trigger('closed.ace.widget');
					$box.remove();
				}
			)
		}
		
		this.toggle = function(type, button) {
			var $box = this.$box;
			var $body = $box.find('.widget-body').eq(0);
			var $icon = null;
			
			var event_name = typeof type !== 'undefined' ? type : ($box.hasClass('collapsed') ? 'show' : 'hide');
			var event_complete_name = event_name == 'show' ? 'shown' : 'hidden';

			if(typeof button === 'undefined') {
				button = $box.find('> .widget-header a[data-action=collapse]').eq(0);
				if(button.length == 0) button = null;
			}

			if(button) {
				$icon = button.find(ace.vars['.icon']).eq(0);

				var $match
				var $icon_down = null
				var $icon_up = null
				if( ($icon_down = $icon.attr('data-icon-show')) ) {
					$icon_up = $icon.attr('data-icon-hide')
				}
				else if( $match = $icon.attr('class').match(/fa\-(.*)\-(up|down)/) ) {
					$icon_down = 'fa-'+$match[1]+'-down'
					$icon_up = 'fa-'+$match[1]+'-up'
				}
			}

			var expandSpeed   = 250;
			var collapseSpeed = 200;

			if( event_name == 'show' ) {
				if($icon) $icon.removeClass($icon_down).addClass($icon_up);

				$body.hide();
				$box.removeClass('collapsed');
				$body.slideDown(expandSpeed, function(){
					$box.trigger(event_complete_name+'.ace.widget')
				})
			}
			else {
				if($icon) $icon.removeClass($icon_up).addClass($icon_down);
				$body.slideUp(collapseSpeed, function(){
						$box.addClass('collapsed')
						$box.trigger(event_complete_name+'.ace.widget')
					}
				);
			}
		}
		
		this.hide = function() {
			this.toggle('hide');
		}
		this.show = function() {
			this.toggle('show');
		}
		
		
		this.fullscreen = function() {
			var $icon = this.$box.find('> .widget-header a[data-action=fullscreen]').find(ace.vars['.icon']).eq(0);
			var $icon_expand = null
			var $icon_compress = null
			if( ($icon_expand = $icon.attr('data-icon1')) ) {
				$icon_compress = $icon.attr('data-icon2')
			}
			else {
				$icon_expand = 'fa-expand';
				$icon_compress = 'fa-compress';
			}
			
			
			if(!this.$box.hasClass('fullscreen')) {
				$icon.removeClass($icon_expand).addClass($icon_compress);
				this.$box.addClass('fullscreen');
				
				applyScrollbars(this.$box, true);
			}
			else {
				$icon.addClass($icon_expand).removeClass($icon_compress);
				this.$box.removeClass('fullscreen');
				
				applyScrollbars(this.$box, false);
			}
			
			this.$box.trigger('fullscreened.ace.widget')
		}

	}
	
	$.fn.widget_box = function (option, value) {
		var method_call;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('widget_box');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('widget_box', (data = new Widget_Box(this, options)));
			if (typeof option === 'string') method_call = data[option](value);
		});

		return (method_call === undefined) ? $set : method_call;
	};


	$(document).on('click.ace.widget', '.widget-header a[data-action]', function (ev) {
		ev.preventDefault();

		var $this = $(this);
		var $box = $this.closest('.widget-box');
		if( $box.length == 0 || $box.hasClass('ui-sortable-helper') ) return;

		var $widget_box = $box.data('widget_box');
		if (!$widget_box) {
			$box.data('widget_box', ($widget_box = new Widget_Box($box.get(0))));
		}

		var $action = $this.data('action');
		if($action == 'collapse') {
			var event_name = $box.hasClass('collapsed') ? 'show' : 'hide';

			var event
			$box.trigger(event = $.Event(event_name+'.ace.widget'))
			if (event.isDefaultPrevented()) return

			$widget_box.toggle(event_name, $this);
		}
		else if($action == 'close') {
			var event
			$box.trigger(event = $.Event('close.ace.widget'))
			if (event.isDefaultPrevented()) return

			$widget_box.close();
		}
		else if($action == 'reload') {
			$this.blur();
			var event
			$box.trigger(event = $.Event('reload.ace.widget'))
			if (event.isDefaultPrevented()) return

			$widget_box.reload();
		}
		else if($action == 'fullscreen') {
			var event
			$box.trigger(event = $.Event('fullscreen.ace.widget'))
			if (event.isDefaultPrevented()) return
		
			$widget_box.fullscreen();
		}
		else if($action == 'settings') {
			$box.trigger('setting.ace.widget')
		}

	});
	
		
	function applyScrollbars($widget, enable) {
		var $main = $widget.find('.widget-main').eq(0);
		$(window).off('resize.widget.scroll');
		
		//IE8 has an unresolvable issue!!! re-scrollbaring with unknown values?!
		var nativeScrollbars = ace.vars['old_ie'] || ace.vars['touch'];
		
		if(enable) {
			var ace_scroll = $main.data('ace_scroll');
			if( ace_scroll ) {
				$main.data('save_scroll', {size: ace_scroll['size'], lock: ace_scroll['lock'], lock_anyway: ace_scroll['lock_anyway']});
			}
			
			var size = $widget.height() - $widget.find('.widget-header').height() - 10;//extra paddings
			size = parseInt(size);
			
			$main.css('min-height', size);
			if( !nativeScrollbars ) {
				if( ace_scroll ) {
					$main.ace_scroll('update', {'size': size, 'mouseWheelLock': true, 'lockAnyway': true});
				}
				else {
					$main.ace_scroll({'size': size, 'mouseWheelLock': true, 'lockAnyway': true});
				}
				$main.ace_scroll('enable').ace_scroll('reset');
			}
			else {
				if( ace_scroll ) $main.ace_scroll('disable');
				$main.css('max-height', size).addClass('overflow-scroll');
			}
			
			
			$(window)
			.on('resize.widget.scroll', function() {
				var size = $widget.height() - $widget.find('.widget-header').height() - 10;//extra paddings
				size = parseInt(size);
				
				$main.css('min-height', size);
				if( !nativeScrollbars ) {
					$main.ace_scroll('update', {'size': size}).ace_scroll('reset');
				}
				else {
					$main.css('max-height', size).addClass('overflow-scroll');
				}
			});
		}
		
		else  {
			$main.css('min-height', '');
			var saved_scroll = $main.data('save_scroll');
			if(saved_scroll) {
				$main
				.ace_scroll('update', {'size': saved_scroll['size'], 'mouseWheelLock': saved_scroll['lock'], 'lockAnyway': saved_scroll['lock_anyway']})
				.ace_scroll('enable')
				.ace_scroll('reset');
			}
			
			if( !nativeScrollbars ) {				
				if(!saved_scroll) $main.ace_scroll('disable');				
			}
			else {
				$main.css('max-height', '').removeClass('overflow-scroll');
			}
		}
	}

})(window.jQuery);

/**
 <b>Settings box</b>. It's good for demo only. You don't need this.
*/
(function($ , undefined) {

 $('#ace-settings-btn').on(ace.click_event, function(e){
	e.preventDefault();

	$(this).toggleClass('open');
	$('#ace-settings-box').toggleClass('open');
 })

 $('#ace-settings-navbar').on('click', function(){
	ace.settings.navbar_fixed(null, this.checked);//@ ace-extra.js
	//$(window).triggerHandler('resize.navbar');

	//force redraw?
	//if(ace.vars['webkit']) ace.helper.redraw(document.body);
 }).each(function(){this.checked = ace.settings.is('navbar', 'fixed')})

 $('#ace-settings-sidebar').on('click', function(){
	ace.settings.sidebar_fixed(null, this.checked);//@ ace-extra.js

	//if(ace.vars['webkit']) ace.helper.redraw(document.body);
 }).each(function(){this.checked = ace.settings.is('sidebar', 'fixed')})

 $('#ace-settings-breadcrumbs').on('click', function(){
	ace.settings.breadcrumbs_fixed(null, this.checked);//@ ace-extra.js

	//if(ace.vars['webkit']) ace.helper.redraw(document.body);
 }).each(function(){this.checked = ace.settings.is('breadcrumbs', 'fixed')})

 $('#ace-settings-add-container').on('click', function(){
	ace.settings.main_container_fixed(null, this.checked);//@ ace-extra.js

	//if(ace.vars['webkit']) ace.helper.redraw(document.body);
 }).each(function(){this.checked = ace.settings.is('main-container', 'fixed')})



 $('#ace-settings-compact').on('click', function(){
	if(this.checked) {
		$('#sidebar').addClass('compact');
		var hover = $('#ace-settings-hover');
		if( hover.length > 0 ) {
			hover.removeAttr('checked').trigger('click');
		}
	}
	else {
		$('#sidebar').removeClass('compact');
		$('#sidebar[data-sidebar-scroll=true]').ace_sidebar_scroll('reset')
	}
	
	if(ace.vars['old_ie']) ace.helper.redraw($('#sidebar')[0], true);
 })/*.removeAttr('checked')*/


 $('#ace-settings-highlight').on('click', function(){
	if(this.checked) $('#sidebar .nav-list > li').addClass('highlight');
	else $('#sidebar .nav-list > li').removeClass('highlight');
	
	if(ace.vars['old_ie']) ace.helper.redraw($('#sidebar')[0]);
 })/*.removeAttr('checked')*/


 $('#ace-settings-hover').on('click', function(){
	if($('#sidebar').hasClass('h-sidebar')) return;
	if(this.checked) {
		$('#sidebar li').addClass('hover')
		.filter('.open').removeClass('open').find('> .submenu').css('display', 'none');
		//and remove .open items
	}
	else {
		$('#sidebar li.hover').removeClass('hover');

		var compact = $('#ace-settings-compact');
		if( compact.length > 0 && compact.get(0).checked ) {
			compact.trigger('click');
		}
	}
	
	$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('reset')
	$('.sidebar[data-sidebar-scroll=true]').ace_sidebar_scroll('reset')
	
	if(ace.vars['old_ie']) ace.helper.redraw($('#sidebar')[0]);
 })/*.removeAttr('checked')*/

})(jQuery);

/**
<b>RTL</b> (right-to-left direction for Arabic, Hebrew, Persian languages).
It's good for demo only.
You should hard code RTL-specific changes inside your HTML/server-side code.
Dynamically switching to RTL using Javascript is not a good idea.
Please refer to documentation for more info.
*/


(function($ , undefined) {
 //Switching to RTL (right to left) Mode
 $('#ace-settings-rtl').removeAttr('checked').on('click', function(){
	switch_direction();
 });
 
 
 //>>> you should hard code changes inside HTML for RTL direction
 //you shouldn't use this function to switch direction
 //this is only for dynamically switching for demonstration
 //take a look at this function to see what changes should be made
 //also take a look at docs for some tips
 var switch_direction = function() {
	if($('#ace-rtl-stylesheet').length == 0) {
		//let's load RTL stylesheet only when needed!
		var ace_style = $('head').find('link.ace-main-stylesheet');
		if(ace_style.length == 0) {
			ace_style = $('head').find('link[href*="/ace.min.css"],link[href*="/ace-part2.min.css"]');
			if(ace_style.length == 0) {
				ace_style = $('head').find('link[href*="/ace.css"],link[href*="/ace-part2.css"]');
			}
		}
		
		var ace_skins = $('head').find('link#ace-skins-stylesheet');
		var stylesheet_url = ace_style.first().attr('href').replace(/(\.min)?\.css$/i , '-rtl$1.css');
		$.ajax({
			'url': stylesheet_url
		}).done(function() {
			var new_link = jQuery('<link />', {type : 'text/css', rel: 'stylesheet', 'id': 'ace-rtl-stylesheet'})
			if(ace_skins.length > 0) {
				new_link.insertAfter(ace_skins);
			}
			else if(ace_style.length > 0){
				new_link.insertAfter(ace_style.last());
			}
			else new_link.appendTo('head');
		
			new_link.attr('href', stylesheet_url);
			//we set "href" after insertion, for IE to work
			
			applyChanges();
			if(window.Pace && Pace.running)	Pace.stop();
		})		
	}
	else {
		applyChanges();
	}
	
	//in ajax when new content is loaded, we dynamically apply RTL changes again
	//please note that this is only for Ace demo
	//for info about RTL see Ace's docs
	$('.page-content-area[data-ajax-content=true]').on('ajaxscriptsloaded.rtl', function() {
		if( $('body').hasClass('rtl') ) {
			applyChanges(this);
		}
	});

	/////////////////////////
	function applyChanges(el) {
		var $body = $(document.body);
		if(!el) $body.toggleClass('rtl');//el is 'body'

		el = el || document.body;		
		var $container = $(el);
		$container
		//toggle pull-right class on dropdown-menu
		.find('.dropdown-menu:not(.datepicker-dropdown,.colorpicker)').toggleClass('dropdown-menu-right')
		.end()
		//swap pull-left & pull-right
		.find('.pull-right:not(.dropdown-menu,blockquote,.profile-skills .pull-right)').removeClass('pull-right').addClass('tmp-rtl-pull-right')
		.end()
		.find('.pull-left:not(.dropdown-submenu,.profile-skills .pull-left)').removeClass('pull-left').addClass('pull-right')
		.end()
		.find('.tmp-rtl-pull-right').removeClass('tmp-rtl-pull-right').addClass('pull-left')
		.end()
		
		.find('.chosen-select').toggleClass('chosen-rtl').next().toggleClass('chosen-rtl');
		

		function swap_classes(class1, class2) {
			$container
			 .find('.'+class1).removeClass(class1).addClass('tmp-rtl-'+class1)
			 .end()
			 .find('.'+class2).removeClass(class2).addClass(class1)
			 .end()
			 .find('.tmp-rtl-'+class1).removeClass('tmp-rtl-'+class1).addClass(class2)
		}

		swap_classes('align-left', 'align-right');
		swap_classes('no-padding-left', 'no-padding-right');
		swap_classes('arrowed', 'arrowed-right');
		swap_classes('arrowed-in', 'arrowed-in-right');
		swap_classes('tabs-left', 'tabs-right');
		swap_classes('messagebar-item-left', 'messagebar-item-right');//for inbox page
		
		$('.modal.aside-vc').ace_aside('flip').ace_aside('insideContainer');
		
		
		//mirror all icons and attributes that have a "fa-*-right|left" attrobute
		$container.find('.fa').each(function() {
			if(this.className.match(/ui-icon/) || $(this).closest('.fc-button').length > 0) return;
			//skip mirroring icons of plugins that have built in RTL support

			var l = this.attributes.length;
			for(var i = 0 ; i < l ; i++) {
				var val = this.attributes[i].value;
				if(val.match(/fa\-(?:[\w\-]+)\-left/)) 
					this.attributes[i].value = val.replace(/fa\-([\w\-]+)\-(left)/i , 'fa-$1-right')
				 else if(val.match(/fa\-(?:[\w\-]+)\-right/)) 
					this.attributes[i].value = val.replace(/fa\-([\w\-]+)\-(right)/i , 'fa-$1-left')
			}
		});
		
		//browsers are incosistent with horizontal scroll and RTL
		//so let's make our scrollbars LTR and wrap the content inside RTL
		var rtl = $body.hasClass('rtl');
		if(rtl)	{
			$container.find('.scroll-hz').addClass('make-ltr')
			.find('.scroll-content')
			.wrapInner('<div class="make-rtl" />');
			$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('changeDir', 'right');
		}
		else {
			//remove the wrap
			$container.find('.scroll-hz').removeClass('make-ltr')
			.find('.make-rtl').children().unwrap();
			$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('changeDir', 'left');
		}
		if($.fn.ace_scroll) $container.find('.scroll-hz').ace_scroll('reset') //to reset scrollLeft

		//redraw the traffic pie chart on homepage with a different parameter
		try {
			var placeholder = $('#piechart-placeholder');
			if(placeholder.length > 0) {
				var pos = $body.hasClass('rtl') ? 'nw' : 'ne';//draw on north-west or north-east?
				placeholder.data('draw').call(placeholder.get(0) , placeholder, placeholder.data('chart'), pos);
			}
		}catch(e) {}
		
		
		ace.helper.redraw(el, true);
	}
 }
})(jQuery);




/**
 <b>Select a different skin</b>. It's good for demo only.
 You should hard code skin-specific changes inside your HTML/server-side code.
 Please refer to documentation for more info.
*/

(function($ , undefined) {
  try {
	$('#skin-colorpicker').ace_colorpicker({'auto_pos': false});
  } catch(e) {}

  $('#skin-colorpicker').on('change', function(){
	var skin_class = $(this).find('option:selected').data('skin');

	if($('#ace-skins-stylesheet').length == 0) {
		//let's load skins stylesheet only when needed!
		var ace_style = $('head').find('link.ace-main-stylesheet');
		if(ace_style.length == 0) {
			ace_style = $('head').find('link[href*="/ace.min.css"],link[href*="/ace-part2.min.css"]');
			if(ace_style.length == 0) {
				ace_style = $('head').find('link[href*="/ace.css"],link[href*="/ace-part2.css"]');
			}
		}
		
		var stylesheet_url = ace_style.first().attr('href').replace(/(\.min)?\.css$/i , '-skins$1.css');
		$.ajax({
			'url': stylesheet_url
		}).done(function() {
			var new_link = jQuery('<link />', {type : 'text/css', rel: 'stylesheet', 'id': 'ace-skins-stylesheet'})
			if(ace_style.length > 0){
				new_link.insertAfter(ace_style.last());
			}
			else new_link.appendTo('head');
	
			new_link.attr('href', stylesheet_url);
			//we set "href" after insertion, for IE to work
			
			applyChanges(skin_class);
			if(window.Pace && Pace.running)	Pace.stop();
		})
	}
	else {
		applyChanges(skin_class);
	}


	function applyChanges(skin_class) {
		//skin cookie tip
		var body = $(document.body);
		body.removeClass('no-skin skin-1 skin-2 skin-3');
		//if(skin_class != 'skin-0') {
			body.addClass(skin_class);
			ace.data.set('skin', skin_class);
			//save the selected skin to cookies
			//which can later be used by your server side app to set the skin
			//for example: <body class="<?php echo $_COOKIE['ace_skin']; ?>"
		//} else ace.data.remove('skin');
		
		var skin3_colors = ['red', 'blue', 'green', ''];

		
			//undo skin-1
			$('.ace-nav > li.grey').removeClass('dark');
			
			//undo skin-2
			$('.ace-nav > li').removeClass('no-border margin-1');
			$('.ace-nav > li:not(:last-child)').removeClass('light-pink').find('> a > '+ace.vars['.icon']).removeClass('pink').end().eq(0).find('.badge').removeClass('badge-warning');
			$('.sidebar-shortcuts .btn')
			.removeClass('btn-pink btn-white')
			.find(ace.vars['.icon']).removeClass('white');
			
			//undo skin-3
			$('.ace-nav > li.grey').removeClass('red').find('.badge').removeClass('badge-yellow');
			$('.sidebar-shortcuts .btn').removeClass('btn-primary btn-white')
			var i = 0;
			$('.sidebar-shortcuts .btn').each(function() {
				$(this).find(ace.vars['.icon']).removeClass(skin3_colors[i++]);
			})
		
		

		
		var skin0_buttons = ['btn-success', 'btn-info', 'btn-warning', 'btn-danger'];
		if(skin_class == 'no-skin') {
			var i = 0;
			$('.sidebar-shortcuts .btn').each(function() {
				$(this).attr('class', 'btn ' + skin0_buttons[i++%4]);
			})
			
			$('.sidebar[data-sidebar-scroll=true]').ace_sidebar_scroll('updateStyle', '');
			$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('updateStyle', 'no-track scroll-thin');
		}

		else if(skin_class == 'skin-1') {
			$('.ace-nav > li.grey').addClass('dark');
			var i = 0;
			$('.sidebar-shortcuts')
			.find('.btn').each(function() {
				$(this).attr('class', 'btn ' + skin0_buttons[i++%4]);
			})
			
			$('.sidebar[data-sidebar-scroll=true]').ace_sidebar_scroll('updateStyle', 'scroll-white no-track');
			$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('updateStyle', 'no-track scroll-thin scroll-white');
		}

		else if(skin_class == 'skin-2') {
			$('.ace-nav > li').addClass('no-border margin-1');
			$('.ace-nav > li:not(:last-child)').addClass('light-pink').find('> a > '+ace.vars['.icon']).addClass('pink').end().eq(0).find('.badge').addClass('badge-warning');
			
			$('.sidebar-shortcuts .btn').attr('class', 'btn btn-white btn-pink')
			.find(ace.vars['.icon']).addClass('white');
			
			$('.sidebar[data-sidebar-scroll=true]').ace_sidebar_scroll('updateStyle', 'scroll-white no-track');
			$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('updateStyle', 'no-track scroll-thin scroll-white');
		}

		//skin-3
		//change shortcut buttons classes, this should be hard-coded if you want to choose this skin
		else if(skin_class == 'skin-3') {
			body.addClass('no-skin');//because skin-3 has many parts of no-skin as well
			
			$('.ace-nav > li.grey').addClass('red').find('.badge').addClass('badge-yellow');
			
			var i = 0;
			$('.sidebar-shortcuts .btn').each(function() {
				$(this).attr('class', 'btn btn-primary btn-white');
				$(this).find(ace.vars['.icon']).addClass(skin3_colors[i++]);
			})
			
			$('.sidebar[data-sidebar-scroll=true]').ace_sidebar_scroll('updateStyle', 'scroll-dark no-track');
			$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('updateStyle', 'no-track scroll-thin');
		}

		//some sizing differences may be there in skins, so reset scrollbar size
		$('.sidebar[data-sidebar-scroll=true]').ace_sidebar_scroll('reset')
		//$('.sidebar[data-sidebar-hover=true]').ace_sidebar_hover('reset')
		
		if(ace.vars['old_ie']) ace.helper.redraw(document.body, true);
	}

 })
})(jQuery);

/**
 The widget box reload button/event handler. You should use your own handler. An example is available at <i class="text-info">examples/widgets.html</i>.
 <u><i class="glyphicon glyphicon-flash"></i> You don't need this. Used for demo only</u>
*/

(function($ , undefined) {

	//***default action for reload in this demo
	//you should remove this and add your own handler for each specific .widget-box
	//when data is finished loading or processing is done you can call $box.trigger('reloaded.ace.widget')
	$(document).on('reload.ace.widget', '.widget-box', function (ev) {
		var $box = $(this);
		
		//trigger the reloaded event to remove the spinner icon after 1-2 seconds
		setTimeout(function() {
			$box.trigger('reloaded.ace.widget');
		}, parseInt(Math.random() * 1000 + 1000));
	});

	//you may want to do something like this:
	/**
	$('#my-widget-box').on('reload.ace.widget', function(){
		//load new data here
		//and when finished trigger "reloaded" event
		$(this).trigger('reloaded.ace.widget');
	});
	*/
})(window.jQuery);

/**
The autocomplete dropdown when typing inside search box.
<u><i class="glyphicon glyphicon-flash"></i> You don't need this. Used for demo only</u>
*/
(function($ , undefined) {

	ace.vars['US_STATES'] = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Dakota","North Carolina","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]
	try {
		$('#nav-search-input').bs_typeahead({
			source: ace.vars['US_STATES'],
			updater:function (item) {
				//when an item is selected from dropdown menu, focus back to input element
				$('#nav-search-input').focus();
				return item;
			}
		});
	} catch(e) {}

})(window.jQuery);

/**
 <b>Auto content padding on fixed navbar &amp; breadcrumbs</b>.
 Navbar's content and height is often predictable and when navbar is fixed we can add appropriate padding to content area using CSS.
 
 But when navbar is fixed and its content size and height is not predictable we may need to add the necessary padding to content area dynamically using Javascript.

 It's not often needed and you can have good results using CSS3 media queries to add necessary paddings based on window size.
*/
(function($ , undefined) {

	var navbar = $('.navbar').eq(0);
	var navbar_container = $('.navbar-container').eq(0);
	
	var sidebar = $('.sidebar').eq(0);
	
	var main_container = $('.main-container').get(0);
	
	var breadcrumbs = $('.breadcrumbs').eq(0);
	var page_content = $('.page-content').get(0);
	
	var default_padding = 8

	if(navbar.length > 0) {
	  $(window).on('resize.auto_padding', function() {
		if( navbar.css('position') == 'fixed' ) {
			var padding1 = !ace.vars['nav_collapse'] ? navbar.outerHeight() : navbar_container.outerHeight();
			padding1 = parseInt(padding1);
			main_container.style.paddingTop = padding1 + 'px';
			
			if(ace.vars['non_auto_fixed'] && sidebar.length > 0) {
				if(sidebar.css('position') == 'fixed') {
					sidebar.get(0).style.top = padding1 + 'px';
				}
				else sidebar.get(0).style.top = '';
			}

			if( breadcrumbs.length > 0 ) {
				if(breadcrumbs.css('position') == 'fixed') {
					var padding2 = default_padding + breadcrumbs.outerHeight() + parseInt(breadcrumbs.css('margin-top'));
					padding2 = parseInt(padding2);
					page_content.style['paddingTop'] = padding2 + 'px';

					if(ace.vars['non_auto_fixed']) breadcrumbs.get(0).style.top = padding1 + 'px';
				} else {
					page_content.style.paddingTop = '';
					if(ace.vars['non_auto_fixed']) breadcrumbs.get(0).style.top = '';
				}
			}
		}
		else {
			main_container.style.paddingTop = '';
			page_content.style.paddingTop = '';
			
			if(ace.vars['non_auto_fixed']) {
				if(sidebar.length > 0) {
					sidebar.get(0).style.top = '';
				}
				if(breadcrumbs.length > 0) {
					breadcrumbs.get(0).style.top = '';
				}
			}
		}
	  }).triggerHandler('resize.auto_padding');

	  $(document).on('settings.ace.auto_padding', function(ev, event_name, event_val) {
		if(event_name == 'navbar_fixed' || event_name == 'breadcrumbs_fixed') {
			if(ace.vars['webkit']) {
				//force new 'css position' values to kick in
				navbar.get(0).offsetHeight;
				if(breadcrumbs.length > 0) breadcrumbs.get(0).offsetHeight;
			}
			$(window).triggerHandler('resize.auto_padding');
		}
	  });
	  
	  /**$('#skin-colorpicker').on('change', function() {
		$(window).triggerHandler('resize.auto_padding');
	  });*/
	}

})(window.jQuery);

/**
 <b>Auto Container</b> Adds .container when window size is above 1140px.
 In Bootstrap you should stick with fixed width breakpoints.
 You can use this feature to enable fixed container only when window size is above 1140px
*/
(function($ , undefined) {

 $(window).on('resize.auto_container', function() {
	var enable = $(window).width() > 1140;
	try {
		ace.settings.main_container_fixed(enable, false, false);
	} catch(e) {
		if(enable) $('.main-container,.navbar-container').addClass('container');
		else $('.main-container,.navbar-container').removeClass('container');
		$(document).trigger('settings.ace', ['main_container_fixed' , enable]);
	}
 }).triggerHandler('resize.auto_container');

})(window.jQuery);

