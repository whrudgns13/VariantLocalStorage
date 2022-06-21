sap.ui.define([
    "gw/controller/BaseController.controller",
    "sap/ui/core/Fragment",
    "sap/ui/comp/variants/VariantItem"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,Fragment,VariantItem) {
        "use strict";

        return Controller.extend("gw.controller.Main", {
            onInit: function () {
                //let a = jQuery.sap.declare("gw.controller.Main",Controller);
                //console.log(a);
                this.router = this.getRounter();
                let oView = this.getView();
                let oCurrencyFB = oView.byId("currency");
                oCurrencyFB.setBusy(true);
                oView.getModel().read("/BusinessPartnerSet",{
                    success : function(oData){
                        let currency = [...new Set(oData.results.map(data=> data.CurrencyCode))]
                        .map(cur=>{
                            return {
                                key : cur,
                                text : cur
                            }
                        });
                        
                        let oFbModel = new sap.ui.model.json.JSONModel({currency});
                        oView.setModel(oFbModel,"fb");
                        oCurrencyFB.setBusy(false);
                    },
                    error : function(oErr){
                        console.log(oErr);
                    }
                });
                this.setVariant();
            },
            onSearch : function(){
                let _self = this;
                let oView = this.getView();
                let oTable = oView.byId("partnerTable");
                let aFilters = [];
                
                oTable.setBusy(true);
                 
                this.filterBar.getFilterGroupItems().forEach(filterbar=>{
                    let label = filterbar.getLabel();
                    let oControl = filterbar.getControl();
                    let sElementName = oControl.getMetadata().getElementName();
                    switch(sElementName){
                        case "sap.m.Input" : 
                            if(oControl.getValue()){
                                aFilters.push(new sap.ui.model.Filter(label,"Contains",oControl.getValue()))
                            }
                        break;
                        case "sap.m.ComboBox" : 
                            if(oControl.getSelectedKey()){
                                aFilters.push(new sap.ui.model.Filter(label,"EQ",oControl.getSelectedKey()))
                            }
                        break;
                    }
                });

                oView.getModel().read("/BusinessPartnerSet",{  
                    filters : aFilters,
                    success : function(oData){
                        oView.setModel(new sap.ui.model.json.JSONModel(oData.results),"partner");
                        _self.oPartnerModel = oView.getModel("partner");
                        oTable.setBusy(false);
                    },
                    error : function(oErr){
                        console.log(oErr);
                    }
                });
                
            },
            onDetail : function(oEvent){
                let oView = this.getView();
                let aPath = oEvent.getSource().getParent().getBindingContext("partner").getPath().split("/");
                let sItemIndex = aPath[aPath.length-1];
                let aPartnerModel = this.oPartnerModel.getProperty("/");
                let oAddress = aPartnerModel[sItemIndex].Address;
                aPartnerModel[sItemIndex].Address = `${oAddress.City} ${oAddress.Country} ${oAddress.PostalCode}`
                let oDetailModel = new sap.ui.model.json.JSONModel(aPartnerModel[sItemIndex]);
                oView.setModel(oDetailModel,"partnerDetail");
                this.openDetailDialog();
            },
            openDetailDialog : function(){
                let oView = this.getView();
                
                if(!this.detailDialog){
                    this.detailDialog = Fragment.load({
                        name : "gw.view.PartnerDetail",
                        controller : this
                    });
                }

                this.detailDialog.then(oDialog=>{
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            },
            onDetailClose : function(){
                this.detailDialog.then(oDialog=>oDialog.close());
            },
            onTableItemPress : function(oEvent){
                let aPath = oEvent.getSource().getBindingContext("partner").getPath();
                this.router.navTo("SalesOrder",{
                    partnerID : aPath.substr(1)
                })
            }
        });
    });
