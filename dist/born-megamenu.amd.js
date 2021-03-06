define(["exports", "@borngroup/born-utilities"], function (_exports, _bornUtilities) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  var Megamenu = /*#__PURE__*/function () {
    function Megamenu(options) {
      _classCallCheck(this, Megamenu);

      //Keep track of the original set of options for easy referencing or restore later.
      this.originalOptions = options; //Clone options to prevent mutations.

      this.options = (0, _bornUtilities.objectAssign)({}, this.originalOptions);
      this.setProperties();
      this.menu = typeof this.options.menuSelector === 'string' ? document.querySelector(this.options.menuSelector) : this.options.menuSelector;

      if (!this.menu) {
        console.warn('Could not find target element');
        return;
      } //Store the original HTML so that we can retrieve it later if the `` option is enabled.


      this.menuOriginalHTML = this.menu.innerHTML;

      if (this.options.reInitOnBreakpointChange) {
        window.addEventListener('resize', function () {
          if (!window.matchMedia(this.currentBreakpoint.breakpoint).matches) {
            this.reInitialize();
          }
        }.bind(this));
      }

      this.setupInteractions();
    }
    /**
     * Resets Megamenu by restoring the HTML to its original state, and removes all events attached to the Menu DOM element.
     */


    _createClass(Megamenu, [{
      key: "destroy",
      value: function destroy() {
        this.menu.textContent = '';
        this.manageMenuControlListeners(true);
        this.menu.insertAdjacentHTML('afterbegin', this.menuOriginalHTML);
      }
    }, {
      key: "reInitialize",
      value: function reInitialize() {
        this.destroy(); //Clone options to prevent mutations.

        this.options = (0, _bornUtilities.objectAssign)({}, this.originalOptions);
        this.setProperties();
        this.setupInteractions();
      }
    }, {
      key: "setupInteractions",
      value: function setupInteractions() {
        this.setupEventCallbacks();
        this.menu.triggers = this.menu.querySelectorAll(this.options.triggerSelector);
        [].forEach.call(this.menu.triggers, this.setupMenuTriggers.bind(this));
        this.setupMenuControlListeners();
      }
    }, {
      key: "setupEventCallbacks",
      value: function setupEventCallbacks() {
        this._beforeTriggerUnset = this.options.beforeTriggerUnset || function () {};

        this._afterTriggerSet = this.options.afterTriggerSet || function () {};

        this._afterMenuSet = this.options.afterMenuSet || function () {};

        this._afterTriggerUnset = this.options.afterTriggerUnset || function () {};

        this._afterMenuUnset = this.options.afterMenuUnset || function () {};
      }
      /**
       * Loop through all of the available menu listeners and either attach or detach events.
       * This is useful to quickly destroy all bound events in the case the menu should be re-initialized without replacing the main Menu DOM element.
       * @param  {[type]} detach [description]
       * @return {[type]}        [description]
       */

    }, {
      key: "manageMenuControlListeners",
      value: function manageMenuControlListeners(detach) {
        Object.keys(this.menuListeners).forEach(function (key) {
          this.menu[detach ? 'removeEventListener' : 'addEventListener'](this.menuListeners[key].type, this.menuListeners[key].handler);
        }.bind(this));
      }
      /**
       * Create a list of event/handlers that are attached to the Menu DOM element, so that it is easy to detach later on if the MegaMenu is destroyed or re-initialized.
       */

    }, {
      key: "createMenuControlListeners",
      value: function createMenuControlListeners() {
        var self = this;
        this.menuListeners = {
          getCursorSpeed: {
            type: 'mousemove',
            handler: self.getCursorSpeed.bind(self)
          },
          unsetOnClick: {
            type: 'click',
            //Leverage unsetCurrentSubmenu() and listen to clicks or keyboard events to close the menu.
            handler: function (evt) {
              self.isKeyboardEvent = false;
              self.unsetCurrentSubmenu(evt);
            }.bind(self)
          },
          unsetOnKeydown: {
            type: 'keydown',
            //Set a separate keydown events to handle keyboard-only navigation focus shifting.
            handler: function (evt) {
              self.isKeyboardEvent = true;
              self.unsetCurrentSubmenu(evt);
            }.bind(self)
          }
        }; //Determines if 'menu' should be closed when hovering out of it.

        if (this.options.unsetOnMouseleave) {
          this.menuListeners.unsetOnMouseleave = {
            type: 'mouseleave',
            handler: this.unsetSiblings.bind(this)
          };
        }
      }
    }, {
      key: "setupMenuControlListeners",
      value: function setupMenuControlListeners() {
        this.createMenuControlListeners();
        this.manageMenuControlListeners(); //Listen to whenever a trigger gains focus. If the focused trigger is not active, unset all of its siblings.
        //This prevents a navigation panel from staying open when using the keyboard (Tab) to navigate around.

        if (this.options.unsetSubmenuOnFocusOut) {
          document.addEventListener('focusin', function (evt) {
            //Only proceed if the menu is active AND the event is keyboard in order to prevent clashing with mouse events.
            //This prevents setting an active trigger twice when clicking on it.
            if (this.menu.isActive && this.isKeyboardEvent) {
              var lastActiveTrigger = this.getLastActiveTrigger();

              if (document.activeElement.megamenu && lastActiveTrigger && this.isSiblingTrigger(document.activeElement, lastActiveTrigger)) {
                this.unsetSiblings(document.activeElement);
              } else if (!lastActiveTrigger.megamenu.target.contains(document.activeElement)) {
                this.unsetSiblings();
              }
            }
          }.bind(this));
        } //Unsets the menu whenever the user clicks outside of it.


        if (this.options.unsetOnClickOut) {
          document.addEventListener('click', function (evt) {
            if (this.menu.isActive && !this.menu.contains(evt.target)) {
              this.unsetSiblings();
            }
          }.bind(this));
        }
      }
      /**
       * Calculates the speed at which the cursor is moving inside the 'menu'.
       * If the curve is too fast and skewed (meaning not vertical/horizontal), then the hover action will be ignored.
       * @param  {[Object]} evt ['mousemove' event object]
       */

    }, {
      key: "getCursorSpeed",
      value: function getCursorSpeed(evt) {
        var newX = Math.abs(evt.clientX),
            newY = Math.abs(evt.clientY),
            diffX = Math.abs((this._origX || 0) - newX),
            diffY = Math.abs((this._origY || 0) - newY);
        this._origX = newX;
        this._origY = newY;
        this.isMouseMoveFast = diffX / diffY >= 0.5 ? true : false;
      }
      /**
       * Sets up the properties for the menu. These can be configured on a breakpoint basis.
       */

    }, {
      key: "setProperties",
      value: function setProperties() {
        this.options.events = this.options.events || 'touchstart click keydown';
        this.options.menuActiveClass = this.options.menuActiveClass || 'mega--active';
        this.options.itemActiveClass = this.options.itemActiveClass || 'mega-item--active';
        this.options.waitForTransition = this.options.hasOwnProperty('waitForTransition') ? this.options.waitForTransition : {}; //Only attach properties to `waitForTransition` object if it's available.

        if (this.options.waitForTransition) {
          this.options.waitForTransition.selector = this.options.waitForTransition.selector || this.options.targetSelector;
          this.options.waitForTransition.property = this.options.waitForTransition.property || 'all';
        }

        this.options.unsetOnMouseleave = this.options.hasOwnProperty('unsetOnMouseleave') ? this.options.unsetOnMouseleave : false;
        this.options.unsetOnClickOut = this.options.hasOwnProperty('unsetOnClickOut') ? this.options.unsetOnClickOut : true;
        this.options.disableUnsetSelf = this.options.disableUnsetSelf || null;
        this.options.hoverDelay = this.options.hoverDelay || 0; //Loops through the responsive array to replace default settings with breakpoint specific settings.

        if (this.options.responsive) {
          this.options.responsive.sort(_lowestBreakpoint); //Not using forEach cause can't kill the loop.

          for (var i = 0; i < this.options.responsive.length; i++) {
            if (_mergeBreakpointProperties.call(this, this.options.responsive[i])) {
              this.currentBreakpoint = this.options.responsive[i];
              break;
            }
          }
        } //Some settings contain properties that are too deep, and since our pathetic attemp at an `objectAssign` method does not support deep copies,
        //we just re-set them here after the fact.


        this.options.keyboardNavigation = (0, _bornUtilities.objectAssign)({
          triggers: [13, 32],
          horizontal: '*',
          vertical: false,
          manageTabIndex: false
        }, this.options.keyboardNavigation);
        /**
         * Updates properties with those coming from a matching breakpoint.
         * @param  {[Object]} breakpointOpts literal with all breakpoint specific settings
         * @return {[Boolean]}
         */

        function _mergeBreakpointProperties(breakpointOpts) {
          if (window.matchMedia(breakpointOpts.breakpoint).matches) {
            return (0, _bornUtilities.objectAssign)(this.options, breakpointOpts.settings);
          }

          return false;
        }

        function _lowestBreakpoint(a, b) {
          return a.breakpoint > b.breakpoint;
        }
      }
      /**
       * Sets item/trigger specific settings and handlers
       * @param  {[Node]} trigger [Node to which the settings are going to be applied to]
       */

    }, {
      key: "setupMenuTriggers",
      value: function setupMenuTriggers(trigger, index) {
        var menuItemID = trigger.id || this.getMenuItemID();
        trigger.megamenu = {
          disableUnsetSelf: this.options.disableUnsetSelf ? typeof this.options.disableUnsetSelf === 'string' ? trigger.matches(this.options.disableUnsetSelf) : true : false
        };
        trigger.megamenu.parent = this.getTriggerParent(trigger);
        trigger.megamenu.siblings = this.getTriggerSiblings(trigger);
        trigger.megamenu.index = trigger.megamenu.siblings.indexOf(trigger); //Only add a .target property to the trigger if it doesn't have a 'data-menu-close' attribute.
        //Sometimes an element with this attribute may also be a trigger in case it should be part of the keyboard navigation.

        if (!trigger.hasAttribute('data-menu-close')) {
          trigger.megamenu.target = this.getTriggerTarget(trigger);
        }

        if (this.options.keyboardNavigation.manageTabIndex) {
          this.setInitialTabIndex(trigger, index);
        }

        this.setupKeyboardHandlers(trigger);

        if (trigger.megamenu.target) {
          var optionsCustomAttributes; //Only set children triggers if the current trigger has a target.

          trigger.megamenu.children = this.getTriggerChildren(trigger.megamenu.target);
          this.setupActivationHandlers(trigger); //Set DOM IDs to the trigger and target elements for proper aria-attribute tagging.

          trigger.id = menuItemID;
          trigger.megamenu.target.id = trigger.megamenu.target.id || "".concat(menuItemID, "--target");
          optionsCustomAttributes = typeof this.options.customAttributes === 'function' ? this.options.customAttributes(trigger) : this.options.customAttributes;
          trigger.megamenu.customAttributes = (0, _bornUtilities.objectAssign)(this.getCustomAttributes(trigger), optionsCustomAttributes);
          this.updateAttributes(trigger);
        } //Unsets the sibling items when the listener is fired on elements with the 'unsetSiblingsSelector' class


        if (trigger.matches(this.options.unsetSiblingsSelector)) {
          var eventsArray = this.getEventsArray(trigger);
          eventsArray.forEach(function (currentEvt) {
            trigger.addEventListener(currentEvt, function () {
              this.unsetSiblings(trigger);
            }.bind(this));
          }.bind(this));
        }
      }
    }, {
      key: "setInitialTabIndex",
      value: function setInitialTabIndex(trigger, index) {
        trigger.tabIndex = index === 0 ? '0' : '-1'; //Set the initial `this._previousFocus` element.

        this._previousFocus = index === 0 ? trigger : this._previousFocus;
      }
      /**
       * Checks if trigger is able to be focused, for example the target trigger may only appear after a transition.
       */

    }, {
      key: "shiftFocus",
      value: function shiftFocus(trigger, setDirection, moveForward) {
        if (this._previousFocus && this.options.keyboardNavigation.manageTabIndex) {
          this._previousFocus.tabIndex = '-1';
        }

        if (trigger) {
          //Check whenever focus should be shifted in a specific direction.
          //Should be ignored if focus is shifted to a specific element, i.e. by using keyboard characters.
          //And only do so if the current trigger has at least one sibling.
          if (setDirection && trigger.megamenu.siblings.length > 1) {
            var consumedChecks = 0; //Check wether the provided `trigger` is visible, if it's not, skip to the next visible one.
            //Short-circuit if the loop went through all avaiable items, prevents infinite loops.

            while (!this.elConsumesSpace(trigger) && consumedChecks <= trigger.megamenu.siblings.length) {
              consumedChecks++;
              trigger = this.getDirectionTrigger(trigger, moveForward);
            }
          } //Update the `this._previousFocus` element with the provided `trigger` element.


          this._previousFocus = trigger;

          if (this.options.keyboardNavigation.manageTabIndex) {
            trigger.tabIndex = '0';
          }

          (0, _bornUtilities.forceFocus)(trigger);
        }
      }
      /**
       * Checks if an element is currently consuming space in the DOM.
       * An element with, or a child of, display: none; will consume no space.
       * @param  {[type]} el [description]
       * @return {[type]}    [description]
       */

    }, {
      key: "elConsumesSpace",
      value: function elConsumesSpace(el) {
        return el.offsetParent || el.firstElementChild && el.firstElementChild.offsetHeight > 0;
      }
      /**
       * Generate a random MenuItemID string to be used in the trigger and target elements in case they don't have an ID.
       * @return {[type]}         [description]
       */

    }, {
      key: "getMenuItemID",
      value: function getMenuItemID() {
        var randomString = Math.floor(new Date().getTime() * Math.random()).toString().substr(0, 4);
        return "menuItemID-".concat(randomString);
      }
      /**
       * Setup custom attributes for the megamenu trigger and the target.
       * Default to setting a few aria-attributes to give more context to the browser.
       * @param  {[type]} trigger [description]
       * @return {[type]}         [description]
       */

    }, {
      key: "getCustomAttributes",
      value: function getCustomAttributes(trigger) {
        //`value`: [String | Array] If Array, index 0 is used when megamenu is unset, and index 1 is used when it's set.
        //`trigger`: [Boolean] Set to true to only attach the attribute to the trigger element.
        //`target`: [Boolean] Set to true to only attach the attribute to the target element.
        return {
          'aria-expanded': {
            value: ['false', 'true'],
            trigger: true
          },
          'aria-labelledby': {
            value: trigger.id,
            target: true
          },
          'aria-controls': {
            value: trigger.megamenu.target.id,
            trigger: true
          }
        };
      }
      /**
       * Loop through the `trigger.megamenu.customAttributes` object and update the configured attributes.
       * This method is also called whenever the megamenu is set or unset, in case the attributes should change.
       * @param  {[type]}  trigger  [description]
       * @param  {Boolean} isActive [description]
       * @return {[type]}           [description]
       */

    }, {
      key: "updateAttributes",
      value: function updateAttributes(trigger, isActive) {
        var customAttributes = trigger.megamenu.customAttributes;

        for (var attrKey in customAttributes) {
          if (customAttributes[attrKey]) {
            if (customAttributes[attrKey].trigger) {
              this.setAttributeValue(trigger, attrKey, customAttributes[attrKey], isActive);
            } else if (customAttributes[attrKey].target) {
              this.setAttributeValue(trigger.megamenu.target, attrKey, customAttributes[attrKey], isActive);
            } else {
              this.setAttributeValue(trigger, attrKey, customAttributes[attrKey], isActive);
              this.setAttributeValue(trigger.megamenu.target, attrKey, customAttributes[attrKey], isActive);
            }
          }
        }
      }
      /**
       * Updates a single MegaItem element with the custom attributes provided in `attrName` and `attrObject`
       * Set the `isActive` argument to TRUE to swap the attribute value when `attrObject.value` is an Array.
       */

    }, {
      key: "setAttributeValue",
      value: function setAttributeValue(el, attrName, attrObject, isActive) {
        var value = typeof attrObject.value === 'string' ? attrObject.value : isActive ? attrObject.value[1] : attrObject.value[0];
        el.setAttribute(attrName, value);
      }
      /**
       * Gets the parent of the passed Node
       * @param  {[HTMLNode]} trigger [Node where we're getting the parent Node from]
       * @return {[HTMLNode]} [Parent of the passed element]
       */

    }, {
      key: "getTriggerParent",
      value: function getTriggerParent(trigger) {
        return trigger.closest(trigger.getAttribute('data-menu-parent')) || trigger.parentNode;
      }
      /**
       * Gets the target of the passed Node (the first matching Node from the query)
       * @param  {[HTMLNode]} trigger [Node where we're getting the target Node from]
       * @return {[HTMLNode]} [Target of the passed element]
       */

    }, {
      key: "getTriggerTarget",
      value: function getTriggerTarget(trigger) {
        return trigger.megamenu.parent.querySelector(trigger.getAttribute('data-menu-target') || this.options.targetSelector);
      }
    }, {
      key: "getTriggerChildren",
      value: function getTriggerChildren(target) {
        return target.querySelectorAll(this.options.triggerSelector);
      }
    }, {
      key: "getTriggerSiblings",
      value: function getTriggerSiblings(trigger) {
        var closestParentContainer = this.getClosestSiblingsParent(trigger);
        return [].filter.call(this.menu.triggers, function (currentTrigger) {
          return closestParentContainer.contains(currentTrigger) && this.isSiblingTrigger(trigger, currentTrigger);
        }.bind(this));
      }
    }, {
      key: "getClosestSiblingsParent",
      value: function getClosestSiblingsParent(trigger) {
        if (trigger && trigger.nodeName) {
          return trigger.closest(trigger.getAttribute('data-menu-parent') || this.options.targetSelector) || this.menu;
        } else if (!trigger || trigger.relatedTarget && trigger.relatedTarget !== null) {
          return this.menu;
        } else {
          return;
        }
      }
    }, {
      key: "isSiblingTrigger",
      value: function isSiblingTrigger(currentTrigger, testTrigger) {
        return currentTrigger.getAttribute(this.options.matchingSiblingsAttribute) === testTrigger.getAttribute(this.options.matchingSiblingsAttribute);
      }
    }, {
      key: "isTriggerActive",
      value: function isTriggerActive(trigger) {
        return trigger.megamenu.isActive;
      }
      /**
       * Find the next trigger in the MegaMenu's trigger list that appears after the currently focused trigger,
       * and that matches the currently focused trigger's `matchingSiblingsAttribute` attribute value.
       */

    }, {
      key: "getDirectionTrigger",
      value: function getDirectionTrigger(trigger, moveForward) {
        var followingTrigger = null;

        if (moveForward) {
          followingTrigger = trigger.megamenu.siblings[trigger.megamenu.index + 1] || trigger.megamenu.siblings[0];
        } else {
          followingTrigger = trigger.megamenu.siblings[trigger.megamenu.index - 1] || trigger.megamenu.siblings[trigger.megamenu.siblings.length - 1];
        }

        return followingTrigger;
      }
      /**
       * Returns the trigger element whose label's first character code matches the provided `charCode`.
       */

    }, {
      key: "getMatchingCharTrigger",
      value: function getMatchingCharTrigger(trigger, charCode) {
        var matchingTrigger = null;

        for (var i = 0; i < trigger.megamenu.siblings.length; i++) {
          if (trigger.megamenu.siblings[i].textContent.toUpperCase().trim().charCodeAt(0) === charCode && trigger.megamenu.siblings[i] !== trigger) {
            matchingTrigger = trigger.megamenu.siblings[i];
            break;
          }
        }

        return matchingTrigger;
      }
      /**
       * Returns the event list based on the current trigger configuration.
       * This allows attaching events on a per-selector-match basis, using the following sample format:
       * events: [
       *      {
       *          selector: '.level-1',
       *          events: 'touchstart mouseenter keydown'
       *      },
       *      {
       *          selector: ':not(.level-1)',
       *          events: 'touchstart click keydown'
       *      }
       * ]
       */

    }, {
      key: "getEventsArray",
      value: function getEventsArray(trigger) {
        var eventsArray = [];

        if (typeof this.options.events === 'string') {
          eventsArray = this.options.events.split(' ');
        } else if (Array.isArray(this.options.events)) {
          this.options.events.forEach(function (currentEventGroup) {
            if (trigger.matches(currentEventGroup.selector)) {
              eventsArray = eventsArray.concat(currentEventGroup.events.split(' '));
            }
          });
        }

        return eventsArray;
      }
      /**
       * Uses 'this.options.events' to set up handlers on per item/trigger basis.
       * @param  {[Node]} trigger [Node where we're setting handlers to]
       */

    }, {
      key: "setupActivationHandlers",
      value: function setupActivationHandlers(trigger) {
        var scope = this,
            eventsArray = this.getEventsArray(trigger);
        eventsArray.forEach(function (currentEvt) {
          trigger.addEventListener(currentEvt, function (evt) {
            var evtType = evt.type,
                isTouch = evtType.indexOf('touch') >= 0,
                isKeyboard = evtType === 'keydown' || evtType === 'keyup',
                allowClickThrough = scope.options.clickThroughSelector && trigger.matches(scope.options.clickThroughSelector); //Check if click was on an allowed element, if so allow link through.

            if (isTouch || (trigger.nodeName === 'A' || evt.target.nodeName === 'A') && !allowClickThrough && !isKeyboard) {
              evt.preventDefault();
            }

            if (evtType === 'mouseenter' || evtType === 'mouseover') {
              var minDelay = scope.isMouseMoveFast && !scope.options.hoverDelay ? 100 : scope.options.hoverDelay; //Add a delay before toggleTriggerActive if isMouseMoveFast is true or hoverDelay is set and the menu is not yet active

              if (scope.isMouseMoveFast || scope.options.hoverDelay && !scope.menu.isActive) {
                scope.overstay = window.setTimeout(function () {
                  scope.toggleTriggerActive(this, true);
                }.bind(this), minDelay);
                return;
              } else {
                scope.toggleTriggerActive(this, true);
              }
            } else if (isKeyboard) {
              //If the keyCode matches an item on the options.keyboardNavigation.triggers Array, toggle the submenu.
              if (scope.options.keyboardNavigation.triggers.indexOf(evt.keyCode) !== -1 && !allowClickThrough) {
                evt.preventDefault();
                scope.toggleTriggerActive(this); //Move the focus to the first trigger in the submenu

                scope.shiftFocus(trigger.megamenu.children[0], true, true);
              } //Prevent clicks/Enter key on "allowClickThrough" elements from opening the submenu.

            } else if (evt.type !== 'click' || !allowClickThrough) {
              scope.toggleTriggerActive(this);
              scope.shiftFocus(this);
            } //Making sure further events are not fired after touch


            if (isTouch) {
              evt.stopImmediatePropagation();
            }
          });
        });
        trigger.megamenu.parent.addEventListener('mouseleave', function () {
          clearInterval(scope.overstay);
        });
      }
      /**
       * Handles keyboard events for arrows, character keys, home/end, etc.
       */

    }, {
      key: "setupKeyboardHandlers",
      value: function setupKeyboardHandlers(trigger) {
        trigger.addEventListener('keydown', function (evt) {
          var isLeftArrow = evt.keyCode === 37,
              isUpArrow = evt.keyCode === 38,
              isRightArrow = evt.keyCode === 39,
              isDownArrow = evt.keyCode === 40; //I'm sorry about this, but the W3.org has A TON of requirements for a fully ADA compliant navigation: https://www.w3.org/TR/wai-aria-practices-1.1/examples/menubar/menubar-1/menubar-1.html
          //So be ready for this messy if/else pizza party.

          if (isLeftArrow || isUpArrow || isRightArrow || isDownArrow) {
            //Shift focus to previous or next sibling/submenu trigger when pressing the Arrow keys.
            var matchesHorizontal = this.options.keyboardNavigation.horizontal && trigger.matches(this.options.keyboardNavigation.horizontal),
                matchesVertical = this.options.keyboardNavigation.vertical && trigger.matches(this.options.keyboardNavigation.vertical),
                isHorizontalNavigation = (isLeftArrow || isRightArrow) && matchesHorizontal,
                isVerticalNavigation = (isUpArrow || isDownArrow) && matchesVertical;
            evt.preventDefault();

            if (isHorizontalNavigation || isVerticalNavigation) {
              var moveForward = isRightArrow || isDownArrow,
                  directionTrigger = this.getDirectionTrigger.call(this, trigger, moveForward);
              this.shiftFocus(directionTrigger, true, moveForward);
            } else {
              if ((matchesHorizontal && isDownArrow || matchesVertical && isRightArrow) && trigger.megamenu.target) {
                var triggerIsActive = this.isTriggerActive(trigger); //Avoid untoggling the trigger if it was already activated.
                //This scenario only happens when both keyboard and mouse/touch are used at the same time.
                //It's not a necessity, but the lack of it was keeping me up at night.

                if (!triggerIsActive) {
                  this.toggleTriggerActive(trigger);
                } //Move the focus to the first trigger in the submenu.


                this.shiftFocus(trigger.megamenu.children[0], true, true);
              } else if (matchesVertical && (isRightArrow || isLeftArrow)) {
                var lastActiveTrigger = this.getLastActiveTrigger(),
                    targetTrigger = lastActiveTrigger,
                    setDirection = false,
                    _moveForward = false;

                if (isRightArrow && !trigger.megamenu.target) {
                  setDirection = true;
                  _moveForward = true;
                  targetTrigger = this.getDirectionTrigger.call(this, lastActiveTrigger, true);
                  targetTrigger.megamenu.target ? this.toggleTriggerActive(targetTrigger) : this.unsetSiblings(targetTrigger);
                } else if (isLeftArrow) {
                  this.unsetSiblings(lastActiveTrigger);
                }

                this.shiftFocus(targetTrigger, setDirection, _moveForward);
              }
            }
          } else if (evt.keyCode >= 65 && evt.keyCode <= 90) {
            //Shift focus to matching sibling trigger when pressing a character key.
            var matchingTrigger = this.getMatchingCharTrigger.call(this, trigger, evt.keyCode);
            this.shiftFocus(matchingTrigger);
          } else if (evt.keyCode === 35) {
            //Shift focus to last sibling trigger when pressing the "End" key.
            this.shiftFocus(trigger.megamenu.siblings[trigger.megamenu.siblings.length - 1], true, false);
          } else if (evt.keyCode === 36) {
            //Shift focus to first sibling trigger when pressing the "Home" key.
            this.shiftFocus(trigger.megamenu.siblings[0], true, true);
          }
        }.bind(this));
      }
      /**
       * If the targeted item/trigger is active, and can be closed, removes the active status.
       * Otherwise trigger is activated and the corresponding callbacks are fired.
       * @param  {[Node]} trigger [description]
       * @param  {[boolean]} isMousehover [description]
       */

    }, {
      key: "toggleTriggerActive",
      value: function toggleTriggerActive(trigger, isMousehover) {
        if (this.isTriggerActive(trigger)) {
          if (!isMousehover && !trigger.megamenu.disableUnsetSelf) {
            this.unsetSiblings(trigger);
          }
        } else {
          this._beforeTriggerUnset(trigger, this);

          this.unsetSiblings(trigger, this.setTriggerActive.bind(this));

          this._afterTriggerSet(trigger, this);
        }
      }
      /**
       * [setTriggerActive description]
          waitForTransition: [Boolean | Object] Used to determine when to set the 'active' state on the menu.
                                      Thist activation will wait until all transitions are complete on the targeted element.
       * @param {[Node]} trigger [item/trigger to set active]
       */

    }, {
      key: "setTriggerActive",
      value: function setTriggerActive(trigger) {
        var SCOPE = this; //Set an `isActive` flag on the individual triggers for easier control on the frontend.

        trigger.megamenu.isActive = true;
        trigger.classList.add(this.options.itemActiveClass);
        trigger.megamenu.target.classList.add(this.options.itemActiveClass);
        trigger.megamenu.parent.classList.add(this.options.itemActiveClass);
        this.updateAttributes(trigger, true); //This needs revision.

        if (!this.menu.isActive) {
          var activeWaitEl = this.options.waitForTransition ? this.menu.querySelector("".concat(this.options.waitForTransition.selector, ".").concat(this.options.itemActiveClass)) : false;

          if (this.canDetectTransition(activeWaitEl)) {
            activeWaitEl.addEventListener((0, _bornUtilities.whichTransition)(), _transitionEndHandler);
          } else {
            this.setMenuActive();
          }
        }

        function _transitionEndHandler(evt) {
          if (SCOPE.options.waitForTransition.property === evt.propertyName || SCOPE.options.waitForTransition.property === 'all') {
            SCOPE.setMenuActive();
            this.removeEventListener((0, _bornUtilities.whichTransition)(), _transitionEndHandler);
          }
        }
      }
      /**
       * [Unsets the active state on the trigger]
       * @param  {[type]} evt     [description]
       * @param  {[type]} trigger [description]
       */

    }, {
      key: "unsetCurrentSubmenu",
      value: function unsetCurrentSubmenu(evt) {
        var isEscKey = evt.keyCode === 27;

        if (isEscKey || (evt.keyCode === 13 || !evt.keyCode) && evt.target.hasAttribute('data-menu-close')) {
          var lastActiveTrigger = this.getLastActiveTrigger();
          evt.preventDefault(); //If this element exists inside a MegaMenu target, close that target.
          //Otherwise close the full menu.

          if (evt.target && this.getClosestSiblingsParent(evt.target)) {
            var targetTriggerSelector = evt.target.getAttribute('data-menu-close'),
                //Set a flag to prevent unsetting the last active trigger when pressing the ESC key AND if disableUnsetSelf is TRUE for the last trigger..
            allowUnset = !isEscKey || lastActiveTrigger && !lastActiveTrigger.megamenu.disableUnsetSelf; //If the data-menu-close element specifies a target selector, use that selector to determine which trigger to unset.

            lastActiveTrigger = targetTriggerSelector ? this.getMatchingActiveTrigger(targetTriggerSelector) || lastActiveTrigger : lastActiveTrigger;

            if (allowUnset) {
              this.unsetSiblings(lastActiveTrigger);
            } else if (evt.target === lastActiveTrigger) {
              //Re-assign `lastActiveTrigger` to the trigger before the last one.
              lastActiveTrigger = this.getLastActiveTrigger(2);
              this.unsetSiblings(lastActiveTrigger);
            } //Prevent the event from bubbling if there's an active trigger.


            if (lastActiveTrigger) {
              evt.stopPropagation();
            }
          } else {
            this.unsetSiblings();
          } //Sets the focus back to the original trigger.


          if (lastActiveTrigger) {
            this.shiftFocus(lastActiveTrigger);
          }
        }
      }
    }, {
      key: "canDetectTransition",
      value: function canDetectTransition(targetEl) {
        return targetEl && window.getComputedStyle(targetEl).transitionDuration !== '0s';
      }
      /**
       * Returns the trigger that was activated last.
       * This is mostly used to determine where to set the focus to when the user is
       * navigating back in the MegaMenu tree, when closing submenus, etc.
       * @return {HTMLNode} [description]
       */

    }, {
      key: "getLastActiveTrigger",
      value: function getLastActiveTrigger() {
        var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        var activeTriggers = this.getActiveTriggers();
        return activeTriggers[activeTriggers.length - index];
      }
      /**
       * Returns an Array of all the currently active triggers within the MegaMenu.
       * @return {Array} [description]
       */

    }, {
      key: "getActiveTriggers",
      value: function getActiveTriggers() {
        return [].filter.call(this.menu.triggers, this.isTriggerActive.bind(this));
      }
      /**
       * Returns a currently active trigger that matches a specified `selector`.
       * @return {HTMLNode}          [description]
       */

    }, {
      key: "getMatchingActiveTrigger",
      value: function getMatchingActiveTrigger(selector) {
        return this.menu.querySelector("".concat(selector, ".").concat(this.options.itemActiveClass));
      }
      /**
       * Sets 'this.menu' to active only if it has any active items, then '_afterMenuSet' is fired.
       */

    }, {
      key: "setMenuActive",
      value: function setMenuActive() {
        if (this.getActiveTriggers().length) {
          this.menu.isActive = true;
          this.menu.classList.add(this.options.menuActiveClass);

          this._afterMenuSet(this.menu, this);
        }
      }
    }, {
      key: "setMenuInactive",
      value: function setMenuInactive() {
        if (!this.getActiveTriggers().length) {
          this.menu.isActive = false;
          this.menu.classList.remove(this.options.menuActiveClass);

          this._afterMenuUnset(this.menu, this);
        }
      }
      /**
       * Unsets all of the `trigger`'s siblings, then '_afterMenuUnset' is fired
       */

    }, {
      key: "unsetSiblings",
      value: function unsetSiblings(trigger, callback) {
        var commonContainer = this.getClosestSiblingsParent(trigger) || this.menu,
            activeElements = commonContainer.querySelectorAll('.' + this.options.itemActiveClass);
        [].forEach.call(activeElements, function (el) {
          el.classList.remove(this.options.itemActiveClass); //If this element is a trigger, fire _afterTriggerUnset.

          if (el.megamenu) {
            el.megamenu.isActive = false;

            this._afterTriggerUnset(el, this); //Remove custom attributes if the current element is a Megamenu trigger.


            if (el.megamenu.target) {
              this.updateAttributes(el);
            }
          }
        }.bind(this)); //Run callback after all sibling menu items have been unset.

        if (typeof callback === 'function') {
          callback(trigger);
        } //If there are no more active items, unset the MegaMenu.


        this.setMenuInactive();
      }
    }]);

    return Megamenu;
  }();

  _exports["default"] = Megamenu;
});
