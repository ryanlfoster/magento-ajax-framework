Magento Ajax Framework
=====================
[![GitHub version](https://badge.fury.io/gh/ecommotion%2Fmagento-ajax-framework.svg)](http://badge.fury.io/gh/ecommotion%2Fmagento-ajax-framework)

An efficient, flexible, event-based AJAX framework for Magento. eCommotion's AJAX framework uses namespaced Javascript events in order to provide a flexible way of listening for certain AJAX calls and updating multiple frontend elements at once.

Simple AJAX requests can easily be done using Prototype or jQuery. This framework is for more complicated AJAX frontends that require multiple independent DOM updates.

Compatibility
-------------
- **CE:** 1.6, 1.7, 1.8, 1.9
- **EE:** 1.12, 1.13, 1.14

Table of contents
-----------------
* [Features](#features)
* [Installation](#installation)
* [Key concepts](#key-concepts)
* [Crash course](#crash-course)
* [Known issues](#known-issues)
* [Support](#support)
* [Contributing](#contributing)
* [Copyright and licence](#copyright-and-licence)


Features
--------
**Events**  
Automatically dispatches namespaced events for every AJAX call  

**Built in javascript classes**  
For dispatching and handling events  

**Observers**   
Re-route controller actions to AJAX versions  

**Improved performance**  
Use layout handles to specify which blocks to return in the AJAX response, avoiding loading an entire page.

Installation
-------------------------
###Via composer (recommended)
1. Install [Composer](https://getcomposer.org)
2. Install the [Magento Composer installer](https://github.com/magento-hackathon/magento-composer-installer)
3. Add the following to your project's `composer.json`  

```javascript
{
    ...
    "require": {
        "ecommotion/magento-ajax-framework":"dev-master"
        ...
    },
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/eCommotion/magento-ajax-framework"
        }
        ...
    ]
}
```

4. Run `composer install` or `composer update` from your project root
5. Clear your caches


###Via modman
1. Install [modman](https://github.com/colinmollenhour/modman)
2. Run the following command in your Magento root directory:
    `modman clone https://github.com/ecommotion/magento-ajax-framework`
3. Clear your caches

###Manual copy (easiest)
1. Recursively copy all the files in the src folder into your document root.
2. Clear your caches


Key concepts
------------

###Dispatchers
Dispatchers create AJAX requests and fire the corresponding events. 

###Handlers
Handlers can be created that listen to nominated events and update the DOM accordingly.

###Events
Events are dispatched in the following format: `mage:ajax:eventName:status`

```
  mage:ajax:testEvent:onInitialize
  mage:ajax:testEvent:onLoading
  mage:ajax:testEvent:onInteractive
  mage:ajax:testEvent:onLoaded
  mage:ajax:testEvent:onSuccess
  mage:ajax:testEvent:onComplete
```


Crash course
-------------
If you want to dive in head-first, here's a quick tutorial on how to AJAXify the default Magento sidebar poll.
In order to keep it short, we will assume the following:

1. You have a javascript file in your skin that you can add to
2. All javascript code mentioned below should be wrapped in a document loaded observer:  

```javascript
  Event.observe(document, 'dom:loaded', function(event) {
    ...
  });
```


###Create the dispatcher
Create a dispatcher for the "Vote" button in the sidebar Poll block. Add the following to your scripts file:

```javascript
  Mage.Ajax.debug = true;

  var pollDispatcher = new Mage.Ajax.Dispatcher({
    selector: '.block-poll .actions .button',
    dispatchEvent: 'submitPoll'
  });
```

This will listen for click events on the "Vote" button and dispatch an event called "submitPoll".

###Create the handler
Add the following code to your javascript file:

```javascript
  var pollHandler = new Mage.Ajax.Handler({
    events: {
      onSuccess: ['submitPoll']
    },
    onSuccess: function() {
      var form = $('pollForm');
      form.down('.block-subtitle').update('Thank you!');
      form.down('.actions').remove();
      $('poll-answers').remove();
    }
  });
```
The `events` object sets up which events the handler should listen for. In this case, we are we are listening for `onSuccess` status of the `submitPoll` event.
Our `onSuccess` method updates the poll block with a "thank you" message.

###Further reading
This has been a very basic example of what the AJAX framework is capable of. For more documentation and examples please visit [the wiki](https://ecommotion.atlassian.net/wiki/display/AJAX/AJAX+Framework).


Known issues
-----------------
1. If using [Nexcess' Turpentine module](http://www.magentocommerce.com/magento-connect/turpentine-varnish-cache.html), AJAX requests cannot be cached because Turpentine breaks the JSON response by injecting a string enclosed in curly braces. 


Support
-------
If you have any issues with this extension, open an issue on [GitHub](https://github.com/ecommotion/magento-ajax-framework/issues).


Contributing
------------
Any contribution is highly appreciated. The best way to contribute code is to open a [pull request on GitHub](https://help.github.com/articles/using-pull-requests).


Copyright and licence
-------
Code and documentation copyright 2014 eCommotion. Code released under the [GNU General Public License, Version 2.0](http://opensource.org/licenses/GPL-2.0)


