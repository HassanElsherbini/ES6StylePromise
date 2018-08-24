'use strict';

function $Promise(executor){
    this._value,
    this._state = 'pending',
    this._handlerGroups = []
  
    //Error
    if(typeof executor !== "function"){
      throw new TypeError("there is no executor function");
    }
  
    executor(this._internalResolve.bind(this), this._internalReject.bind(this));
  }
  
  $Promise.prototype._internalResolve = function(value){
    if (this._state === 'pending'){
      this._state = 'fulfilled';
      this._value = value;
    }
    this.settler();
  };
  
  $Promise.prototype._internalReject = function(reason){
    if (this._state === 'pending'){
      this._state = 'rejected';
      this._value = reason;
    }
    this.settler();
  };
  
  $Promise.prototype.then = function(successHandler, errorHandler){
    let exec = function(){};
    let handlers = {
      successCb: (typeof successHandler === "function" ? successHandler : undefined),
      errorCb: (typeof errorHandler === "function" ? errorHandler : undefined),
      downstreamPromise: new $Promise(exec)
    };
    this._handlerGroups.push(handlers);
    this.settler();
  
    return handlers.downstreamPromise;
  };
  
  $Promise.prototype.settler = function(){
    if (this._handlerGroups.length > 0){
      if (this._state !== "pending"){
        this._callHandlers();
      }
    }
  }
  
  $Promise.prototype._callHandlers = function(){
    let val, handler, pB;
  
    if (this._state === "fulfilled"){
      for (let i = 0; i < this._handlerGroups.length; i++){
        handler = this._handlerGroups[i];
        pB = handler.downstreamPromise;
        if (handler.successCb){
          try {
            val = handler.successCb(this._value);
            if(val instanceof $Promise){
              val.then(pB._internalResolve.bind(pB), pB._internalReject.bind(pB));
            } else {
              pB._internalResolve(val);
            }
          } catch (e){
            pB._internalReject(e);
          }
        } else {
          pB._internalResolve(this._value);
        }
      }
  
    } else if (this._state === 'rejected'){
      for (let i = 0; i < this._handlerGroups.length; i++){
        handler = this._handlerGroups[i];
        pB = handler.downstreamPromise;
       if (handler.errorCb){
        try {
          val = handler.errorCb(this._value);
          if(val instanceof $Promise){
            val.then(pB._internalResolve.bind(pB), pB._internalReject.bind(pB));
          } else {
            pB._internalResolve(val);
          }
        } catch (e){
          handler.downstreamPromise._internalReject(e);
        }
       } else {
        handler.downstreamPromise._internalReject(this._value);
       }
      }
    }
    this._handlerGroups = [];
  
  };
  
  $Promise.prototype.catch = function(err){
    return this.then(null, err);
  };

  module.exports = $Promise;