(function(G) {
"use strict";

function _instanceof(left, right) {
  if (
    right != null &&
    typeof Symbol !== "undefined" &&
    right[Symbol.hasInstance]
  ) {
    return right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);
      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);
      if (desc.get) {
        return desc.get.call(receiver);
      }
      return desc.value;
    };
  }
  return _get(target, property, receiver || target);
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }
  return object;
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? "symbol"
        : typeof obj;
    };
  }
  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!_instanceof(instance, Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}


  /**
   * TimersJS
   *
   * Copyright (c) 2013, 2019 Brett Fattori (bfattori@gmail.com)
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   *
   * 2/2019 - Rewritten in ES6, internals exposed, refactored
   */
  var isNode = typeof process !== "undefined" && process.title && !G;
  var SystemTimers = isNode ? require("timers") : G,
    timerPool = [],
    callbacksPool = [],
    opaque = 0;
  var STATE = {
    INIT: Symbol("INIT"),
    RUNNING: Symbol("RUNNING"),
    PAUSED: Symbol("PAUSED"),
    DEAD: Symbol("DEAD")
  };

  function addTimerToPool(timer) {
    timerPool.push(timer);
    opaque++;
    return opaque;
  }

  function removeTimerFromPool(timer) {
    timerPool = timerPool.filter(function(el) {
      return el.id !== timer.id;
    });
  }

  function addCleanupCallback(callback) {
    callbacksPool.push(callback);
  }

  function dispose(obj) {
    if (obj !== undefined && obj !== null) {
      Object.keys(obj).forEach(function(key) {
        return delete obj[key];
      });
    }
  }

  SystemTimers.setInterval(function() {
    while (callbacksPool.length > 0) {
      dispose(callbacksPool[0]);
      callbacksPool[0] = undefined;
      callbacksPool.shift();
    }
  }, 500);
  /*
   * Internal Classes --------------------------------------------------------------------
   */

  var Timer =
    /*#__PURE__*/
    (function() {
      function Timer(interval, callback) {
        _classCallCheck(this, Timer);

        var prototyping = typeof interval === "undefined";
        this.internal = {
          callback: null,
          systemTimerReference: null,
          systemTimerFunction: null,
          state: STATE.INIT,
          lastTime: Date.now(),
          interval: interval,
          killable: true
        }; // External state object

        this.state = {};

        if (!prototyping) {
          this.id = addTimerToPool(this);
        } // Bind the callback

        if (this.shouldRestart()) {
          this.callback(callback);
          this.restart();
        }

        return this;
      }

      _createClass(Timer, [
        {
          key: "shouldRestart",
          value: function shouldRestart() {
            return true;
          }
        },
        {
          key: "state",
          value: function state(key, value) {
            if (_typeof(key) === "object") this.state = key;
            else if (typeof key === "string" && typeof value === "undefined")
              return this.state[key];
            else if (typeof key === "string" && typeof value !== "undefined")
              this.state[key] = value;
            else return this.state;
          }
        },
        {
          key: "kill",
          value: function kill() {
            if (!this.internal.killable) return this; // The JS engine needs to clean up this timer

            addCleanupCallback(this.internal.systemTimerFunction);
            this.cancel();
            removeTimerFromPool(this);
            this.internal.systemTimerReference = null;
            this.internal.state = STATE.DEAD;
            return undefined;
          }
        },
        {
          key: "systemTimer",
          value: function systemTimer(timer) {
            if (timer) {
              this.internal.systemTimerReference = timer;
            }

            return this.internal.systemTimerReference;
          }
        },
        {
          key: "isRunning",
          value: function isRunning() {
            return this.internal.state === STATE.RUNNING;
          }
        },
        {
          key: "cancel",
          value: function cancel() {
            SystemTimers.clearTimeout(this.systemTimer());
            this.internal.systemTimerReference = null;
            this.internal.running = false;
            return this;
          }
        },
        {
          key: "pause",
          value: function pause() {
            this.cancel();
            this.internal.state = STATE.PAUSED;
            return this;
          }
        },
        {
          key: "restart",
          value: function restart() {
            this.cancel();

            if (this.internal.callback !== null) {
              this.systemTimer(
                SystemTimers.setTimeout(this.callback(), this.interval())
              );
              this.internal.running = true;
              this.internal.state = STATE.RUNNING;
            }

            return this;
          }
        },
        {
          key: "killable",
          value: function killable(state) {
            if (state !== undefined) this.internal.killable = state;
            return this.internal.killable;
          }
        },
        {
          key: "callback",
          value: function callback(_callback) {
            if (_callback) {
              this.setCallback(_callback);
            } else {
              if (this.internal.systemTimerFunction === null) {
                this.internal.systemTimerFunction = function() {
                  var now = Date.now(),
                    delta = now - this.lastTime;
                  this.lastTime = now;

                  if (this.callback) {
                    this.callback.call(this.timer, delta, now);
                  }
                }.bind({
                  timer: this,
                  lastTime: this.internal.lastTime,
                  callback: this.internal.callback
                });
              }
            }

            return this.internal.systemTimerFunction;
          }
        },
        {
          key: "setCallback",
          value: function setCallback(callback) {
            this.internal.callback = callback;
            this.internal.systemTimerFunction = null;

            if (this.isRunning()) {
              this.restart();
            }
          }
        },
        {
          key: "interval",
          value: function interval(_interval) {
            if (_interval !== undefined) {
              this.cancel();
              this.internal.interval = _interval;
            }

            return this.internal.interval;
          }
        }
      ]);

      return Timer;
    })(); // ### Private subclasses ------------------------------------------------------------------

  var RepeaterTimer =
    /*#__PURE__*/
    (function(_Timer) {
      _inherits(RepeaterTimer, _Timer);

      function RepeaterTimer() {
        _classCallCheck(this, RepeaterTimer);

        return _possibleConstructorReturn(
          this,
          _getPrototypeOf(RepeaterTimer).apply(this, arguments)
        );
      }

      _createClass(RepeaterTimer, [
        {
          key: "setCallback",
          value: function setCallback(callback) {
            var internalCallback = function(delta, now) {
              if (this.callbackFunction) {
                this.callbackFunction.call(this.timer, delta, now);
              }

              this.timer.restart();
            }.bind({
              callbackFunction: callback,
              timer: this
            });

            _get(
              _getPrototypeOf(RepeaterTimer.prototype),
              "setCallback",
              this
            ).call(this, internalCallback);
          }
        }
      ]);

      return RepeaterTimer;
    })(Timer);

  var MultiTimer =
    /*#__PURE__*/
    (function(_Timer2) {
      _inherits(MultiTimer, _Timer2);

      function MultiTimer(interval, callback, repetitions, completionCallback) {
        var _this;

        _classCallCheck(this, MultiTimer);

        _this = _possibleConstructorReturn(
          this,
          _getPrototypeOf(MultiTimer).call(this, interval, callback)
        );
        _this.internal.completionCallback = completionCallback;
        _this.internal.repetitions = repetitions;

        _this.callback(callback);

        _this.restart();

        return _this;
      }

      _createClass(MultiTimer, [
        {
          key: "shouldRestart",
          value: function shouldRestart() {
            return false;
          }
        },
        {
          key: "setCallback",
          value: function setCallback(callback) {
            var internalCallback = function(delta, now) {
              if (this.repetitions-- > 0) {
                this.callbackFunction.call(
                  this.timer,
                  this.totalRepetitions,
                  delta,
                  now
                );
                this.totalRepetitions++;
                this.timer.restart();
              } else {
                if (this.completionCallback) {
                  this.completionCallback.call(this.timer, delta, now);
                }

                this.timer.kill();
                addCleanupCallback(this);
              }
            }.bind({
              callbackFunction: callback,
              completionCallback: this.internal.completionCallback,
              repetitions: this.internal.repetitions,
              totalRepetitions: 0,
              timer: this
            });

            _get(
              _getPrototypeOf(MultiTimer.prototype),
              "setCallback",
              this
            ).call(this, internalCallback);
          }
        }
      ]);

      return MultiTimer;
    })(Timer);

  var OneShotTimer =
    /*#__PURE__*/
    (function(_Timer3) {
      _inherits(OneShotTimer, _Timer3);

      function OneShotTimer() {
        _classCallCheck(this, OneShotTimer);

        return _possibleConstructorReturn(
          this,
          _getPrototypeOf(OneShotTimer).apply(this, arguments)
        );
      }

      _createClass(OneShotTimer, [
        {
          key: "setCallback",
          value: function setCallback(callback) {
            var innerCallback = function(delta, now) {
              if (this.callbackFunction) {
                this.callbackFunction.call(this.timer, delta, now);
                this.timer.kill();
                addCleanupCallback(this);
              }
            }.bind({
              callbackFunction: callback,
              timer: this
            });

            _get(
              _getPrototypeOf(OneShotTimer.prototype),
              "setCallback",
              this
            ).call(this, innerCallback);
          }
        },
        {
          key: "restart",
          value: function restart() {
            if (this.internal.state !== STATE.PAUSED && this._running) {
              return;
            }

            _get(_getPrototypeOf(OneShotTimer.prototype), "restart", this).call(
              this
            );
          }
        }
      ]);

      return OneShotTimer;
    })(Timer);

  var TriggerTimer =
    /*#__PURE__*/
    (function(_OneShotTimer) {
      _inherits(TriggerTimer, _OneShotTimer);

      function TriggerTimer(
        interval,
        callback,
        triggerInterval,
        triggerCallback
      ) {
        var _this2;

        _classCallCheck(this, TriggerTimer);

        _this2 = _possibleConstructorReturn(
          this,
          _getPrototypeOf(TriggerTimer).call(this, interval, callback)
        );
        _this2.triggerInterval = triggerInterval;
        _this2.triggerCallback = triggerCallback;

        _this2.callback(callback);

        _this2.restart();

        return _this2;
      }

      _createClass(TriggerTimer, [
        {
          key: "shouldRestart",
          value: function shouldRestart() {
            return false;
          }
        },
        {
          key: "setCallback",
          value: function setCallback(callback) {
            var completionCallback = function(delta, now) {
              this.interval.kill();
              this.intervalCompletionCallback.call(this.timer, delta, now);
              addCleanupCallback(this);
            }.bind({
              interval: new RepeaterTimer(
                this.triggerInterval,
                this.triggerCallback
              ),
              intervalCompletionCallback: callback,
              timer: this
            });

            _get(
              _getPrototypeOf(TriggerTimer.prototype),
              "setCallback",
              this
            ).call(this, completionCallback);
          }
        }
      ]);

      return TriggerTimer;
    })(OneShotTimer);
  /*
   *      PUBLIC API --------------------------------------------------------------------------
   */

  var TimersJS = {
    poolSize: function poolSize() {
      // Subtract the class inheritance objects
      return timerPool.length;
    },
    pauseAllTimers: function pauseAllTimers() {
      timerPool.forEach(function(timer) {
        return timer.pause();
      });
    },
    restartAllTimers: function restartAllTimers() {
      timerPool.forEach(function(timer) {
        return timer.restart();
      });
    },
    cancelAllTimers: function cancelAllTimers() {
      timerPool.forEach(function(timer) {
        return timer.cancel();
      });
    },
    killAllTimers: function killAllTimers() {
      var liveTimers = [];

      while (timerPool.length > 0) {
        var timer = timerPool.shift();
        if (!timer.killable()) liveTimers.push(timer);
        else timer.kill();
      }

      timerPool = liveTimers;
    },
    // Export the classes because Open Source
    exports: {
      Timer: Timer,
      RepeaterTimer: RepeaterTimer,
      MultiTimer: MultiTimer,
      OneShotTimer: OneShotTimer,
      TriggerTimer: TriggerTimer,
      addTimerToPool: addTimerToPool,
      removeTimerFromPool: removeTimerFromPool,
      addCleanupCallback: addCleanupCallback
    },
    // TIMER FACTORY --------------------------------------------------------------
    timer: function timer(interval, callback) {
      return new Timer(interval, callback);
    },
    repeater: function repeater(interval, callback) {
      return new RepeaterTimer(interval, callback);
    },
    multi: function multi(interval, repetitions, callback, completionCallback) {
      return new MultiTimer(
        interval,
        callback,
        repetitions,
        completionCallback
      );
    },
    oneShot: function oneShot(interval, callback) {
      return new OneShotTimer(interval, callback);
    },
    trigger: function trigger(
      interval,
      callback,
      triggerRate,
      triggerCallback
    ) {
      return new TriggerTimer(interval, callback, triggerRate, triggerCallback);
    }
  };
  Object.freeze(TimersJS.exports);

  if (isNode) {
    module.exports = TimersJS;
  } else {
    G.TimersJS = TimersJS;
  }
})();
