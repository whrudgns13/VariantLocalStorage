sap.ui.define([
], function() {
    'use strict';
    return {
        statusFormat : function(state){
            switch(state) {
                case "C" : return "Error";
                case "P" : return "Information";
            }
        }
    }   
});