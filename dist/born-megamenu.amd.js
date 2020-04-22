define(['exports', '@borngroup/born-utilities'], function (exports, _bornUtilities) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var Megamenu = function () {
        function Megamenu(options) {
            _classCallCheck(this, Megamenu);

            this.options = options || {};

            this.setProperties();

            this.menu = typeof this.options.menuSelector === 'string' ? document.querySelector(this.options.menuSelector) : this.options.menuSelector;

            if (!this.menu) {
                console.warn('Could not find target element');

                return;
            }

            this.setupEventCallbacks();

            this.menu.triggers = this.menu.querySelectorAll(this.options.triggerSelector);

            [].forEach.call(this.menu.triggers, this.setupMenuTriggers.bind(this));

            this.setupMenuControlListeners();
        }

        _createClass(Megamenu, [{
            key: 'setupEventCallbacks',
            value: function setupEventCallbacks() {
                this._beforeTriggerUnset = this.options.beforeTriggerUnset || function () {};
                this._afterTriggerSet = this.options.afterTriggerSet || function () {};

                this._afterMenuSet = this.options.afterMenuSet || function () {};
                this._afterTriggerUnset = this.options.afterTriggerUnset || function () {};
                this._afterMenuUnset = this.options.afterMenuUnset || function () {};
            }
        }, {
            key: 'setupMenuControlListeners',
            value: function setupMenuControlListeners() {
                this.menu.addEventListener('mousemove', this.getCursorSpeed.bind(this));

                //Leverage unsetCurrentSubmenu() and listen to clicks or keyboard events to close the menu.
                this.menu.addEventListener('click', function (evt) {
                    this.isKeyboardEvent = false;

                    this.unsetCurrentSubmenu(evt);
                }.bind(this));

                //Set a separate keydown events to handle keyboard-only navigation focus shifting.
                this.menu.addEventListener('keydown', function (evt) {
                    this.isKeyboardEvent = true;

                    this.unsetCurrentSubmenu(evt);
                }.bind(this));

                //Listen to whenever a trigger gains focus. If the focused trigger is not active, unset all of its siblings.
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
                }

                //Unsets the menu whenever the user clicks outside of it.
                if (this.options.unsetOnClickOut) {
                    document.addEventListener('click', function (evt) {
                        if (this.menu.isActive && !this.menu.contains(evt.target)) {
                            this.unsetSiblings();
                        }
                    }.bind(this));
                }

                //Determines if 'menu' should be closed when hovering out of it.
                if (this.options.unsetOnMouseleave) {
                    this.menu.addEventListener('mouseleave', this.unsetSiblings.bind(this));
                }
            }
        }, {
            key: 'getCursorSpeed',
            value: function getCursorSpeed(evt) {
                var newX = Math.abs(evt.clientX),
                    newY = Math.abs(evt.clientY),
                    diffX = Math.abs((this._origX || 0) - newX),
                    diffY = Math.abs((this._origY || 0) - newY);

                this._origX = newX;
                this._origY = newY;

                this.isMouseMoveFast = diffX / diffY >= 0.5 ? true : false;
            }
        }, {
            key: 'setProperties',
            value: function setProperties() {
                this.options.events = this.options.events || 'touchstart click keydown';
                this.options.menuActiveClass = this.options.menuActiveClass || 'mega--active';
                this.options.itemActiveClass = this.options.itemActiveClass || 'mega-item--active';

                this.options.waitForTransition = this.options.hasOwnProperty('waitForTransition') ? this.options.waitForTransition : {};

                //Only attach properties to `waitForTransition` object if it's available.
                if (this.options.waitForTransition) {
                    this.options.waitForTransition.selector = this.options.waitForTransition.selector || this.options.targetSelector;
                    this.options.waitForTransition.property = this.options.waitForTransition.property || 'all';
                }

                this.options.unsetOnMouseleave = this.options.hasOwnProperty('unsetOnMouseleave') ? this.options.unsetOnMouseleave : false;
                this.options.unsetOnClickOut = this.options.hasOwnProperty('unsetOnClickOut') ? this.options.unsetOnClickOut : true;
                this.options.disableUnsetSelf = this.options.disableUnsetSelf || null;
                this.options.hoverDelay = this.options.hoverDelay || 0;

                //Loops through the responsive array to replace default settings with breakpoint specific settings.
                if (this.options.responsive) {
                    this.options.responsive.sort(_lowestBreakpoint);

                    //Not using forEach cause can't kill the loop.
                    for (var i = 0; i < this.options.responsive.length; i++) {
                        if (_mergeBreakpointProperties.call(this, this.options.responsive[i])) {
                            break;
                        }
                    }
                }

                //Some settings contain properties that are too deep, and since our pathetic attemp at an `objectAssign` method does not support deep copies,
                //we just re-set them here after the fact.
                this.options.keyboardNavigation = (0, _bornUtilities.objectAssign)({ triggers: [13, 32], horizontal: '*', vertical: false, manageTabIndex: false }, this.options.keyboardNavigation);

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
        }, {
            key: 'setupMenuTriggers',
            value: function setupMenuTriggers(trigger, index) {
                var menuItemID = trigger.id || this.getMenuItemID();

                trigger.megamenu = {
                    disableUnsetSelf: this.options.disableUnsetSelf ? typeof this.options.disableUnsetSelf === 'string' ? trigger.matches(this.options.disableUnsetSelf) : true : false
                };

                trigger.megamenu.parent = this.getTriggerParent(trigger);
                trigger.megamenu.siblings = this.getTriggerSiblings(trigger);
                trigger.megamenu.index = trigger.megamenu.siblings.indexOf(trigger);

                //Only add a .target property to the trigger if it doesn't have a 'data-menu-close' attribute.
                //Sometimes an element with this attribute may also be a trigger in case it should be part of the keyboard navigation.
                if (!trigger.hasAttribute('data-menu-close')) {
                    trigger.megamenu.target = this.getTriggerTarget(trigger);
                }

                if (this.options.keyboardNavigation.manageTabIndex) {
                    this.setInitialTabIndex(trigger, index);
                }

                this.setupKeyboardHandlers(trigger);

                if (trigger.megamenu.target) {
                    var optionsCustomAttributes = void 0;

                    //Only set children triggers if the current trigger has a target.
                    trigger.megamenu.children = this.getTriggerChildren(trigger.megamenu.target);

                    this.setupActivationHandlers(trigger);

                    //Set DOM IDs to the trigger and target elements for proper aria-attribute tagging.
                    trigger.id = menuItemID;
                    trigger.megamenu.target.id = trigger.megamenu.target.id || menuItemID + '--target';

                    optionsCustomAttributes = typeof this.options.customAttributes === 'function' ? this.options.customAttributes(trigger) : this.options.customAttributes;

                    trigger.megamenu.customAttributes = (0, _bornUtilities.objectAssign)(this.getCustomAttributes(trigger), optionsCustomAttributes);

                    this.updateAttributes(trigger);
                }

                //Unsets the sibling items when the listener is fired on elements with the 'unsetSiblingsSelector' class
                if (trigger.matches(this.options.unsetSiblingsSelector)) {
                    var eventsArray = this.options.events.split(' ');

                    eventsArray.forEach(function (currentEvt) {
                        trigger.addEventListener(currentEvt, function () {
                            this.unsetSiblings(trigger);
                        }.bind(this));
                    }.bind(this));
                }
            }
        }, {
            key: 'setInitialTabIndex',
            value: function setInitialTabIndex(trigger, index) {
                trigger.tabIndex = index === 0 ? '0' : '-1';

                //Set the initial `this._previousFocus` element.
                this._previousFocus = index === 0 ? trigger : this._previousFocus;
            }
        }, {
            key: 'shiftFocus',
            value: function shiftFocus(trigger, setDirection, moveForward) {
                if (this._previousFocus && this.options.keyboardNavigation.manageTabIndex) {
                    this._previousFocus.tabIndex = '-1';
                }

                if (trigger) {
                    //Check whenever focus should be shifted in a specific direction.
                    //Should be ignored if focus is shifted to a specific element, i.e. by using keyboard characters.
                    //And only do so if the current trigger has at least one sibling.
                    if (setDirection && trigger.megamenu.siblings.length > 1) {
                        var consumedChecks = 0;

                        //Check wether the provided `trigger` is visible, if it's not, skip to the next visible one.
                        //Short-circuit if the loop went through all avaiable items, prevents infinite loops.
                        while (!this.elConsumesSpace(trigger) && consumedChecks <= trigger.megamenu.siblings.length) {
                            consumedChecks++;

                            trigger = this.getDirectionTrigger(trigger, moveForward);
                        }
                    }

                    //Update the `this._previousFocus` element with the provided `trigger` element.
                    this._previousFocus = trigger;

                    if (this.options.keyboardNavigation.manageTabIndex) {
                        trigger.tabIndex = '0';
                    }

                    (0, _bornUtilities.forceFocus)(trigger);
                }
            }
        }, {
            key: 'elConsumesSpace',
            value: function elConsumesSpace(el) {
                return el.offsetParent || el.firstElementChild && el.firstElementChild.offsetHeight > 0;
            }
        }, {
            key: 'getMenuItemID',
            value: function getMenuItemID() {
                var randomString = Math.floor(new Date().getTime() * Math.random()).toString().substr(0, 4);

                return 'menuItemID-' + randomString;
            }
        }, {
            key: 'getCustomAttributes',
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
        }, {
            key: 'updateAttributes',
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
        }, {
            key: 'setAttributeValue',
            value: function setAttributeValue(el, attrName, attrObject, isActive) {
                var value = typeof attrObject.value === 'string' ? attrObject.value : isActive ? attrObject.value[1] : attrObject.value[0];

                el.setAttribute(attrName, value);
            }
        }, {
            key: 'getTriggerParent',
            value: function getTriggerParent(trigger) {
                return trigger.parentNode;
            }
        }, {
            key: 'getTriggerTarget',
            value: function getTriggerTarget(trigger) {
                return trigger.megamenu.parent.querySelector(this.options.targetSelector);
            }
        }, {
            key: 'getTriggerChildren',
            value: function getTriggerChildren(target) {
                return target.querySelectorAll(this.options.triggerSelector);
            }
        }, {
            key: 'getTriggerSiblings',
            value: function getTriggerSiblings(trigger) {
                var closestParentContainer = this.getClosestParentTarget(trigger);

                return [].filter.call(this.menu.triggers, function (currentTrigger) {
                    return closestParentContainer.contains(currentTrigger) && this.isSiblingTrigger(trigger, currentTrigger);
                }.bind(this));
            }
        }, {
            key: 'getClosestParentTarget',
            value: function getClosestParentTarget(trigger) {
                if (trigger && trigger.nodeName) {
                    return trigger.closest(this.options.targetSelector) || this.menu;
                } else if (!trigger || trigger.relatedTarget && trigger.relatedTarget !== null) {
                    return this.menu;
                } else {
                    return;
                }
            }
        }, {
            key: 'isSiblingTrigger',
            value: function isSiblingTrigger(currentTrigger, testTrigger) {
                return currentTrigger.getAttribute(this.options.matchingSiblingsAttribute) === testTrigger.getAttribute(this.options.matchingSiblingsAttribute);
            }
        }, {
            key: 'isTriggerActive',
            value: function isTriggerActive(trigger) {
                return trigger.megamenu.isActive;
            }
        }, {
            key: 'getDirectionTrigger',
            value: function getDirectionTrigger(trigger, moveForward) {
                var followingTrigger = null;

                if (moveForward) {
                    followingTrigger = trigger.megamenu.siblings[trigger.megamenu.index + 1] || trigger.megamenu.siblings[0];
                } else {
                    followingTrigger = trigger.megamenu.siblings[trigger.megamenu.index - 1] || trigger.megamenu.siblings[trigger.megamenu.siblings.length - 1];
                }

                return followingTrigger;
            }
        }, {
            key: 'getMatchingCharTrigger',
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
        }, {
            key: 'setupActivationHandlers',
            value: function setupActivationHandlers(trigger) {
                var scope = this,
                    eventsArray = this.options.events.split(' ');

                eventsArray.forEach(function (currentEvt) {
                    trigger.addEventListener(currentEvt, function (evt) {
                        var evtType = evt.type,
                            isTouch = evtType.indexOf('touch') >= 0,
                            isKeyboard = evtType === 'keydown' || evtType === 'keyup',
                            allowClickThrough = scope.options.clickThroughSelector && trigger.matches(scope.options.clickThroughSelector);

                        //Check if click was on an allowed element, if so allow link through.
                        if (isTouch || (trigger.nodeName === 'A' || evt.target.nodeName === 'A') && !allowClickThrough && !isKeyboard) {
                            evt.preventDefault();
                        }

                        if (evtType === 'mouseenter' || evtType === 'mouseover') {
                            var minDelay = scope.isMouseMoveFast && !scope.options.hoverDelay ? 100 : scope.options.hoverDelay;

                            //Add a delay before toggleTriggerActive if isMouseMoveFast is true or hoverDelay is set and the menu is not yet active
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
                                scope.toggleTriggerActive(this);

                                //Move the focus to the first trigger in the submenu
                                scope.shiftFocus(trigger.megamenu.children[0], true, true);
                            }

                            //Prevent clicks/Enter key on "allowClickThrough" elements from opening the submenu.
                        } else if (evt.type !== 'click' || !allowClickThrough) {
                            scope.toggleTriggerActive(this);

                            scope.shiftFocus(this);
                        }

                        //Making sure further events are not fired after touch
                        if (isTouch) {
                            evt.stopImmediatePropagation();
                        }
                    });
                });

                trigger.megamenu.parent.addEventListener('mouseleave', function () {
                    clearInterval(scope.overstay);
                });
            }
        }, {
            key: 'setupKeyboardHandlers',
            value: function setupKeyboardHandlers(trigger) {
                trigger.addEventListener('keydown', function (evt) {
                    var isLeftArrow = evt.keyCode === 37,
                        isUpArrow = evt.keyCode === 38,
                        isRightArrow = evt.keyCode === 39,
                        isDownArrow = evt.keyCode === 40;

                    //I'm sorry about this, but the W3.org has A TON of requirements for a fully ADA compliant navigation: https://www.w3.org/TR/wai-aria-practices-1.1/examples/menubar/menubar-1/menubar-1.html
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
                                var triggerIsActive = this.isTriggerActive(trigger);

                                //Avoid untoggling the trigger if it was already activated.
                                //This scenario only happens when both keyboard and mouse/touch are used at the same time.
                                //It's not a necessity, but the lack of it was keeping me up at night.
                                if (!triggerIsActive) {
                                    this.toggleTriggerActive(trigger);
                                }

                                //Move the focus to the first trigger in the submenu.
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
        }, {
            key: 'toggleTriggerActive',
            value: function toggleTriggerActive(trigger, isMousehover) {
                if (this.isTriggerActive(trigger)) {
                    if (!isMousehover && !trigger.megamenu.disableUnsetSelf) {
                        this.unsetSiblings(trigger);
                    }
                } else {
                    this._beforeTriggerUnset(trigger);
                    this.unsetSiblings(trigger, this.setTriggerActive.bind(this));
                    this._afterTriggerSet(trigger);
                }
            }
        }, {
            key: 'setTriggerActive',
            value: function setTriggerActive(trigger) {
                var SCOPE = this;

                //Set an `isActive` flag on the individual triggers for easier control on the frontend.
                trigger.megamenu.isActive = true;

                trigger.classList.add(this.options.itemActiveClass);
                trigger.megamenu.target.classList.add(this.options.itemActiveClass);
                trigger.megamenu.parent.classList.add(this.options.itemActiveClass);

                this.updateAttributes(trigger, true);

                //This needs revision.
                if (!this.menu.isActive) {
                    var activeWaitEl = this.options.waitForTransition ? this.menu.querySelector(this.options.waitForTransition.selector + '.' + this.options.itemActiveClass) : false;

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
        }, {
            key: 'unsetCurrentSubmenu',
            value: function unsetCurrentSubmenu(evt) {
                if (evt.keyCode === 27 || (evt.keyCode === 13 || !evt.keyCode) && evt.target.hasAttribute('data-menu-close')) {
                    var lastActiveTrigger = this.getLastActiveTrigger();

                    evt.preventDefault();

                    //If this element exists inside a MegaMenu target, close that target.
                    //Otherwise close the full menu.
                    if (evt.target && this.getClosestParentTarget(evt.target)) {
                        var targetTriggerSelector = evt.target.getAttribute('data-menu-close');

                        //If the data-menu-close element specifies a target selector, use that selector to determine which trigger to unset.
                        lastActiveTrigger = targetTriggerSelector ? this.getMatchingActiveTrigger(targetTriggerSelector) || lastActiveTrigger : lastActiveTrigger;

                        this.unsetSiblings(lastActiveTrigger);

                        //Prevent the event from bubbling if there's an active trigger.
                        if (lastActiveTrigger) {
                            evt.stopPropagation();
                        }
                    } else {
                        this.unsetSiblings();
                    }

                    //Sets the focus back to the original trigger.
                    if (lastActiveTrigger) {
                        this.shiftFocus(lastActiveTrigger);
                    }
                }
            }
        }, {
            key: 'canDetectTransition',
            value: function canDetectTransition(targetEl) {
                return targetEl && window.getComputedStyle(targetEl).transitionDuration !== '0s';
            }
        }, {
            key: 'getLastActiveTrigger',
            value: function getLastActiveTrigger() {
                var activeTriggers = this.getActiveTriggers();

                return activeTriggers[activeTriggers.length - 1];
            }
        }, {
            key: 'getActiveTriggers',
            value: function getActiveTriggers() {
                return [].filter.call(this.menu.triggers, this.isTriggerActive.bind(this));
            }
        }, {
            key: 'getMatchingActiveTrigger',
            value: function getMatchingActiveTrigger(selector) {
                return this.menu.querySelector(selector + '.' + this.options.itemActiveClass);
            }
        }, {
            key: 'setMenuActive',
            value: function setMenuActive() {
                if (this.getActiveTriggers().length) {
                    this.menu.isActive = true;
                    this.menu.classList.add(this.options.menuActiveClass);
                    this._afterMenuSet(this.menu);
                }
            }
        }, {
            key: 'setMenuInactive',
            value: function setMenuInactive() {
                if (!this.getActiveTriggers().length) {
                    this.menu.isActive = false;
                    this.menu.classList.remove(this.options.menuActiveClass);
                    this._afterMenuUnset(this.menu);
                }
            }
        }, {
            key: 'unsetSiblings',
            value: function unsetSiblings(trigger, callback) {
                var commonContainer = this.getClosestParentTarget(trigger),
                    activeElements = commonContainer.querySelectorAll('.' + this.options.itemActiveClass);

                [].forEach.call(activeElements, function (el) {
                    el.classList.remove(this.options.itemActiveClass);

                    //If this element is a trigger, fire _afterTriggerUnset.
                    if (el.megamenu) {
                        el.megamenu.isActive = false;

                        this._afterTriggerUnset(el);

                        //Remove custom attributes if the current element is a Megamenu trigger.
                        if (el.megamenu.target) {
                            this.updateAttributes(el);
                        }
                    }
                }.bind(this));

                //Run callback after all sibling menu items have been unset.
                if (typeof callback === 'function') {
                    callback(trigger);
                }

                //If there are no more active items, unset the MegaMenu.
                this.setMenuInactive();
            }
        }]);

        return Megamenu;
    }();

    exports.default = Megamenu;
});
