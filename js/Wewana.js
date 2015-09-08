/**
 * Created with IntelliJ IDEA.
 * User: csalvato
 * Date: 09/03/12
 * Time: 2:14 PM
 *
 * Wewana assignment.
 */

// Create Wewana namespace to prevent pollution of global namespace.
var Wewana = {};

// Define the Event Model
Wewana.Event = Backbone.Model.extend({
    initialize: function(){
        //console.log("Initialized Event Model.");
    },
    defaults: {
        local_id: Wewana.ids,    //Manually creating IDs since not using a system for persistence.
        title: 'New Event',     //text, mandatory, <100 chars
        start: new Date(),      //datetime, mandatory
        end: null,              //datetime, optional
        organiser: 'Unknown',   //text, mandatory <100 chars
        attendee_names: [],     //array of strings
        description: ''         //text, optional
    }
});

//Define the Event Collection
Wewana.EventCollection = Backbone.Collection.extend({
    model: Wewana.Event,

    // Create a comparator to make sorting of the elements by start date easier
    comparator: function(event) {
        return event.get("start").getTime();
    }
});

// Define an event view for looking at event details
Wewana.EventDetailView = Backbone.View.extend({
    tagName: 'li',
    className: 'event-detail',

    events: {
        "click .dismiss-button": "clickedToDismiss"
    },

    clickedToDismiss: function(e) {
        e.preventDefault();
        $("#event-detail-viewer").empty();
    },

    initialize: function() {
        //Bind the render function to "this" then bind  change events to render.
        //  This allows the view to be notified of model changes, and update accordingly.
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
        this.template = _.template($('#event-details-template').html());
    },

    render: function() {
        var renderedContent = this.template(this.model.toJSON());
        $(this.el).html(renderedContent);

        // Always return this, so that calls can be chained
        return this;
    }
});

// Define an event view for rendering individual events within the list view
Wewana.EventView = Backbone.View.extend({
    tagName: 'li',
    className: 'event',

    events: {
        "click .event-detail-link": "clickedForEventDetails",
    },

    clickedForEventDetails: function(e) {
        e.preventDefault();
        console.log(this.model);
        var eventDetailView = new Wewana.EventDetailView({model: this.model});
        $("#event-detail-viewer").empty();
        $("#event-detail-viewer").append(eventDetailView.render().el);
},

    initialize: function() {
        //Bind the render function to "this" then bind  change events to render.
        //  This allows the view to be notified of model changes, and update accordingly.
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
        this.template = _.template($('#event-template').html());
    },

    render: function() {
        var renderedContent = this.template(this.model.toJSON());
        $(this.el).html(renderedContent);

        // Always return this, so that calls can be chained
        return this;
    }
});

// Define the Event List View
Wewana.EventListView = Wewana.EventView.extend({
    tagName: 'section',
    className: 'event-list',

    initialize: function() {
        _.bindAll(this, 'render');
        this.template = _.template($('#event-list-template').html());
        //Re-render on additions to collection
        this.collection.bind('add', this.render);
    },

    render: function() {
        var $events,
            collection = this.collection;

        //Render the template for the events list view.
        $(this.el).html(this.template({}));
        $events = this.$('ul');

        //Draw the view for each event that exists.
        collection.each(function(event){
           var view = new Wewana.EventView({
              model: event,
              collection: collection
           });
           $events.append(view.render().el);
        });

        return this;
    }
});

// Define the Event Manager View
Wewana.EventMangerView = Wewana.EventListView.extend({
    className: 'event-manager',

    initialize: function() {
        this.template = _.template($('#event-manager-template').html());
    },

    render: function() {
        var collection = this.collection;

        //Render the template for the events manager view.
        $(this.el).html(this.template({}));

        //Render the template for the events list view
        var eventListView = new Wewana.EventListView({collection:this.collection});
        this.$("#main-viewer-panel").append(eventListView.render().el);

        return this;
    }
});

//Create Namespace for Helper Functions
Wewana.HelperFunctions = {
    processEventEntryForm: function(/* string */ formElementID, /* collection */ events) {
        // Take form inputs and put into an array
        formArray = $("#entry-form").serializeArray();

        //Process the attendees String
        var attendeesList = (formArray[4].value == "") ? [] : this.attendeeStringToArray(formArray[4].value);

        //Process the start and end dates
        var startdate = $.datepicker.parseDate("mm/dd/yy", formArray[1].value);
        startdate = (startdate) ? startdate : new Date();
        var enddate = (formArray[2].value != "")? $.datepicker.parseDate("mm/dd/yy", formArray[2].value) : null;

        //console.log(formArray);
        var newEvent = new Wewana.Event({
            title: formArray[0].value,
            start: startdate,
            end: formArray[2].value,
            organiser: formArray[3].value,
            attendee_names: attendeesList,
            description: formArray[5].value
        });
        events.add(newEvent);

    },

    attendeeStringToArray: function(/* string */ namesString){
        var names = namesString.split(",");
        for(var i in names){
            names[i] = $.trim(names[i]);
            if( names[i] == "" ) names.splice(i, 1);
        }
        return names;
    },

    presentConfirmationOfEntry: function(message) {
        alert(message);
    }
};

//Create Namespace for Event Handlers
Wewana.EventHandlers = {
    EventSubmissionButtonHandler: function($, events) {
        $("form input[type=submit]").click(function(e) {
            e.preventDefault();
            Wewana.HelperFunctions.processEventEntryForm("#event-entry", events);
        });
    }
};

// Call functions that need to be called on document load
$(document).ready( function() {
        //Create an Event Collection
        var events = new Wewana.EventCollection();

        //Create the initial Events List View with the empty events array, and render it
        var eventManagerView = new Wewana.EventMangerView({collection:events});
        $("#container").append(eventManagerView.render().el);

        //Bind an on-add event to the events collection
        events.on("add", function(event){
            Wewana.HelperFunctions.presentConfirmationOfEntry("Successfully entered event!");

        });

        //Set the date fields to have datepickers
        $(".datepicker").datepicker();

        //Bind the submit button to its handler
        Wewana.EventHandlers.EventSubmissionButtonHandler(jQuery, events);
    }
);