/**
 *
 * Note List View
 *
 * noteListView.js
 * @author Kerri Shotts
 * @version 1.0.0
 *
 * Copyright (c) 2013 Packt Publishing
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
 * OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
/*jshint
         asi:true,
         bitwise:true,
         browser:true,
         curly:true,
         eqeqeq:false,
         forin:true,
         noarg:true,
         noempty:true,
         plusplus:false,
         smarttabs:true,
         sub:true,
         trailing:false,
         undef:true,
         white:false,
         onevar:false 
 */
/*global define*/
define( [ "yasmf", "app/models/noteStorageSingleton", "text!html/noteListView.html!strip",
  "text!html/noteListView_android.html!strip", "text!html/noteListItem.html!strip",
  "app/factories/noteFactory", "app/factories/noteViewFactory"
], function( _y, noteStorageSingleton, noteListViewHTML, noteListViewAndroidHTML,
  noteListItemHTML, noteFactory, noteViewFactory ) {
  var _className = "NoteListView";
  var NoteListView = function() {
    // we descend from a simple ViewContainer
    var self = new _y.UI.ViewContainer();
    // always subclass
    self.subclass( _className );
    // our pointers into the DOM
    self._navigationBar = null;
    self._scrollContainer = null;
    self._listOfNotes = null;
    self._newTextNoteButton = null;
    self._newAudioNoteButton = null;
    self._newImageNoteButton = null;
    self._newVideoNoteButton = null;
    self._createAndEditNote = function( noteType ) {
      // ask storage for a new note
      noteStorageSingleton.createNote( noteType ).then( function( aNewNote ) {
        // create a new editor view
        var aNoteEditView = noteViewFactory.createNoteEditView( noteType );
        // and tell it about the new note
        aNoteEditView.initWithOptions( {
          note: aNewNote,
          parent: self.parentElement
        } );
      } ).catch( function( anError ) {
        console.log( anError )
      } ).done();
    }
    /**
     * Creates a new text note
     */
    self.createNewTextNote = function() {
      self._createAndEditNote( noteFactory.TEXTNOTE );
    };
    /**
     * Edit an existing note. Called when a note item is tapped in the list.
     */
    self.editExistingNote = function( e ) {
      var theEvent = _y.UI.event.convert( this, e ); // this will be the data row
      // get the UID
      var theUID = theEvent.target.getAttribute( "data-uid" );
      // create a new editor view
      var aNote = noteStorageSingleton.getNote( theUID );
      var aNoteEditView = noteViewFactory.createNoteEditView( aNote.class );
      // and tell it about the note
      aNoteEditView.initWithOptions( {
        note: aNote,
        parent: self.parentElement
      } );
    };
    /**
     * Quit the app, in response to a back button event.
     */
    self.quitApp = function() {
      navigator.app.exitApp();
    };
    /**
     * Render the template, passing the app title and translated text
     */
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( _y.device.platform() === "android" ?
        noteListViewAndroidHTML : noteListViewHTML, {
          "APP_TITLE": _y.T( "APP_TITLE" )
        } );
    };
    /**
     * RenderToElement renders the HTML, finds all the elements we want to
     * have references to and attaches handlers if necessary,
     * and attaches a listener to the backButton handler.
     */
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      self._navigationBar = self.element.querySelector( ".ui-navigation-bar" );
      self._scrollContainer = self.element.querySelector( ".ui-scroll-container" );
      self._listOfNotes = self.element.querySelector( ".ui-list" );
      self._newTextNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-page-text-new" );
      self._newAudioNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-sound-wave" );
      self._newImageNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-camera" );
      self._newVideoNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-camera-video" );
      _y.UI.event.addListener( self._newTextNoteButton, "click", self.createNewTextNote );
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.quitApp );
    }
    /**
     * Render the note list; called whenever the storage collection changes
     */
    self.renderList = function() {
      var notes = noteStorageSingleton.collection;
      var fragment = document.createDocumentFragment();
      // loop over each note
      for ( var note in notes ) {
        // and avoid prototype entries
        if ( notes.hasOwnProperty( note ) ) {
          // null notes have been deleted -- don't show them
          if ( notes[ note ] !== null ) {
            // each entry is a li.ui-list-item with data-uid attribute and note_item_% as the id.
            var e = document.createElement( "li" );
            e.className = "ui-list-item";
            e.setAttribute( "data-uid", notes[ note ].uid );
            e.id = "note_item_" + notes[ note ].uid;
            // render the note item template
            e.innerHTML = _y.template( noteListItemHTML, {
              "UID": notes[ note ].uid,
              "NAME": notes[ note ].name,
              "REPRESENTATION": notes[ note ].representation,
              "MODIFIED": _y.D( notes[ note ].modifiedDate, "D" ),
              "INFO": "" + _y.N( notes[ note ].formattedUnitValue ),
			  "STATUS": notes[ note ].status // this line sets the status in the dom to whatever the user input was 
            } );
            // attach any event handlers
            _y.UI.event.addListener( e, "click", self.editExistingNote );
            // append the element to our list
            fragment.appendChild( e );
          }
        }
      }
      self._listOfNotes.innerHTML = "";
      self._listOfNotes.appendChild( fragment );
    };
    self.onOrientationChanged = function() {
      // fix a iOS bug where rotation may prevent the list from scrolling after rotation
      if ( _y.device.platform() == "ios" ) {
        // this forces the scroll container to be recalc'd. It also flickers a bit.
        // no way to avoid it, unfortunately.
        self._scrollContainer.style.display = "none";
        setTimeout( function() {
          self._scrollContainer.style.display = "";
        }, 0 );
      }
    };
    /**
     * Initialize the view and add listeners for the storage
     * collection so that when it changes, we can update appropriately
     */
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      // call super
      self.super( _className, "init", [ undefined, "div", "noteListView ui-container",
        theParentElement
      ] );
      // register for changes in the note collection
      noteStorageSingleton.addListenerForNotification( "collectionChanged", self.renderList );
      noteStorageSingleton.addListenerForNotification( "collectionLoaded", self.renderList );
      // and ask noteStorage to load itself
      noteStorageSingleton.loadCollection();
      // we need to register for orientation changes
      _y.UI.orientationHandler.addListenerForNotification( "orientationChanged", self
        .onOrientationChanged );
    };
    self.overrideSuper( self.class, "initWithOptions", self.init );
    self.initWithOptions = function( options ) {
      var theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
      }
      self.init( theParentElement );
    };
    /**
     * Be a good citizen. Clean up after ourselves when asked.
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      // stop listening for orientation changes
      _y.UI.orientationHandler.removeListenerForNotification( "orientationChanged",
        self.onOrientationChanged );
      // release our objects
      self._navigationBar = null;
      self._newTextNoteButton = null;
      self._newAudioNoteButton = null;
      self._newVideoNoteButton = null;
      self._newImageNoteButton = null;
      self._scrollContainer = null;
      self._listOfNotes = null;
      self.super( _className, "destroy" );
    };
    return self;
  };
  /**
   * Add the necessary translations
   */
  _y.addTranslations( {
    "APP_TITLE": {
      "EN": "Filer"
    },
    "BACK": {
      "EN": "Back",
      "ES": "Volver"
    }
  } );
  return NoteListView;
} );
