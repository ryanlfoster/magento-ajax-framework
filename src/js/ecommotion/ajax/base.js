if (!window.Mage) var Mage = {};

/**************************** AJAX MODEL **************************/
Mage.Ajax = {
  debug: false,
  eventNamespace: 'mage:ajax',
  View: {},
  fireEvent: function(eventName, status, element) {
    var data = Object.extend({
      eventName: eventName
    }, arguments[3] || { });

    if (!element) element = document;

    // Fire two events - one specific to this event and another generic mage:ajax event
    // This allows some handlers to listen for all AJAX related events
    element.fire(this.eventNamespace + ":" + eventName + ":" + status, data);
    element.fire(this.eventNamespace + ":" + status, data);

    // Debug mode
    if(Mage.Ajax.debug) {
      console.log(this.eventNamespace + ":" + eventName + ":" + status);
      console.log(this.eventNamespace + ":" + status);

      if((status == 'onSuccess' || status == 'onFailure') && Object.keys(data).length) {
        console.log(data);
      }
    }
  }
};

/**
 * Customised Prototype Ajax.Request class to dispatch namespaced events
 *
 * Event format: namespace:event:status
 * e.g. mage:ajax:myAjaxEvent:onSuccess
 *
 * @type {Ajax.Request}
 */
Mage.Ajax.Request = Class.create(Ajax.Request, {
  initialize: function($super, url, options) {
    $super(url, options);

    if(typeof options.eventName == 'undefined') throw "No event name specified";
    this.eventName    = options.eventName;
    this.element      = options.element;
  },
  request: function($super, url) {

    if(Mage.Ajax.debug) {
      console.log('New Mage.Ajax.Request for URL ' + url);
    }

    $super(url);
  },
  respondToReadyState: function($super, readyState) {
    $super();
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);
    var eventStatus = '';

    // Dispatch the success/failure events
    if (state == 'Complete') {
      eventStatus ='on' + (this.success() ? 'Success' : 'Failure');
      Mage.Ajax.fireEvent(this.eventName, eventStatus, this.element, response);
    }

    // Normal events
    eventStatus = 'on' + state;
    Mage.Ajax.fireEvent(this.eventName, eventStatus, this.element);

  }
});

/**
 * Abstract AJAX event dispatcher
 *
 * Sends an AJAX request when the specified event is fired
 * Dispatches custom events that can be observed by other classes
 *
 * Utilises data attributes to determine the AJAX URL + events to dispatch:
 *
 *  - data-ajax-url
 *  - data-ajax-event
 *
 */
Mage.Ajax.View.Dispatcher = Class.create({
  initialize: function() {

    var options = Object.extend({
      listenEvent: 'click',
      dispatchEvent: '',
      restartEvents: []
    }, arguments[0] || { });

    //Required
    if(typeof options.selector == 'undefined') throw "No selector specified";

    if(Mage.Ajax.debug) {
      console.log('AJAX Dispatcher created: ' + options.selector);
    }

    var restartEvents = options.restartEvents;
    for(var i=0; i<restartEvents.length; i++) {
      Event.observe(document, restartEvents[i], this._restartHandler.bind(this));
    }

    this.options = options;

    this.start();
  },
  start: function() {
    var listenEvent = this.options.listenEvent;
    var dispatcher = this;
    $$(this.options.selector).each(function(element) {
      //remove any inline onclick functions that might be doing setLocation() calls
      if(listenEvent == 'click') {
        element.onclick = null;
      }
      Event.observe(element, listenEvent, dispatcher._eventHandler.bindAsEventListener(dispatcher, element));
    });
  },
  stop: function() {
    var listenEvent = this.options.listenEvent;
    $$(this.options.selector).each(function(element) {
      element.stopObserving(listenEvent);
    });
  },
  restart: function() {
    this.stop();
    this.start();
  },
  _restartHandler: function(event) {
    this.restart();
  },
  _eventHandler: function(event, element) {
    var url           = this.getUrl(element);
    var eventName     = this.getEventName(element);
    var method        = 'GET';
    var params        = {
      isAjax: true
    };

    //Validate required variables
    if(url == null || url == '') throw "URL could not be determined.";

    var request   = new Mage.Ajax.Request(url, {
      eventName:    eventName,
      element:      element,
      method:       method,
      parameters:   params
    });

    event.stop();
  },
  getDataElement: function(element) {
    return element;
  },
  getEventName: function(element) {
    var dataElement   = this.getDataElement(element);
    var eventName     = dataElement.readAttribute('data-ajax-event');

    // Try to fall back
    if(eventName == null || eventName == '') {
      if(this.options.dispatchEvent != '') {
        eventName = this.options.dispatchEvent;
      } else {
        throw "Could not determine the event to dispatch";
      }
    }

    return eventName;
  },
  getUrl: function(element) {
    // Get the URL to request via AJAX
    var dataElement   = this.getDataElement(element);
    var url           = dataElement.readAttribute('data-ajax-url');

    // Fall back to an anchor tag's href attribute
    if((url == null || url == '') && element.nodeName == 'A') {
      url = element.href;
    }
    // Or grab a form action
    else if(element.readAttribute('type') == 'submit') {
      url = element.up('form').action;
    }

    return url;
  }
});

Mage.Ajax.View.Handler = Class.create({
  statuses: ['onLoading', 'onLoaded', 'onSuccess', 'onFailure'],
  initialize: function(options) {
    this.events = {};
    this.options = options;

    if(typeof options.events === 'string') {
      this.events[options.events] = this.statuses;
    } else {
      this.events = options.events;
    }

    if(Mage.Ajax.debug) {
      console.log('AJAX Handler created: ' + JSON.stringify(this.events));
    }

    for (var status in this.events) {

      var events = this.events[status];

      for(var i=0; i< events.length; i++) {
        Event.observe(
          document,
          Mage.Ajax.eventNamespace + ":" + events[i] + ':' + status,
          (this.options[status]
          || this[status]).bind(this)
        );
      }
    }

  },
  onLoading:  function(event) {},
  onLoaded:   function(event) {},
  onSuccess:  function(event) {},
  onFailure:  function(event) {},
  getBlocks: function(event) {
    var data = event.memo;
    return data.responseJSON.blocks;
  },
  getBlock: function(blocks, name) {
    if(blocks && blocks[name] != 'undefined') {
      return blocks[name];
    }

    return false;
  },
  updateContent: function(receiver, responseText, evalScripts) {

    if (!evalScripts) responseText = responseText.stripScripts();

    receiver.replace(responseText);

  }
});


Mage.Ajax.View.Modal = Class.create({
  defaultTemplate:
    '<div id="#{id}" class="modal fade"> \
      <div class="modal-dialog"> \
        <div class="modal-content"> \
          <div class="modal-header"> \
            <button type="button" class="close" data-dismiss="modal"> \
              <span aria-hidden="true">&times;</span> \
              <span class="sr-only">Close</span> \
            </button> \
            <h4 class="modal-title">#{title}</h4> \
          </div> \
          <div class="modal-body">#{body}</div> \
          <div class="modal-footer">#{footer}</div> \
        </div> \
      </div> \
    </div>',
  defaultCloseBtnSelector: '.modal-header .close',
  initialize: function(config) {

    //Custom settings
    this.showCloseBtn       = config.showCloseBtn || true;
    this.closeBtnSelector   = config.closeBtnSelector || this.defaultCloseBtnSelector;

    //Bootstrap Modal config
    this.params             = config.params;

    //Element setup
    this.template           = new Template(this.defaultTemplate);
    this.parentElement      = config.parentElement;

    //Validate options
    var html                = new Element('div').update(
      this.template.evaluate(config.content)
    );

    this.element            = html.firstDescendant();

    var closeBtn = this.element.down(this.closeBtnSelector)

    if(closeBtn && typeof closeBtn != 'undefined') {

      if(!this.showCloseBtn) {
        closeBtn.hide();
      }

      //Listen for a click event even if the element gets hidden because
      //it might get shown again dynamically
      closeBtn.observe('click', function(event) {this.hide()}.bind(this));
    }

    this.parentElement.insert({
      bottom: this.element
    });


  },
  addButton: function(button, callback) {
    this.element.down('.modal-footer').insert({
      bottom: button
    });

    button.observe('click', callback);
  },
  show: function() {
    this.element.setStyle({display:'block'});
    this.element.addClassName('in');
    $(document.body).addClassName('modal-open');
  },
  hide: function() {
    this.element.hide();
    this.element.removeClassName('in');
    $(document.body).removeClassName('modal-open');
  }
});