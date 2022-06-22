sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/comp/variants/VariantItem",
    'sap/ui/export/Spreadsheet',
	'sap/ui/export/library'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Fragment, VariantItem, Spreadsheet, library) {
        "use strict";

        return Controller.extend("gw.controller.BaseController", {
            setVariant: function () {
                let oView = this.getView();
                this.filterBar = oView.byId("filterbar");
                this.sUserId = sap.ushell.Container.getService("UserInfo").getUser().getId();
                this.variantManager = oView.byId("variantManager");
                this.variantData = this.getLocalStorage();

                if (this.variantData) {                   
                    if(this.variantData.defaultKey){
                        this.variantManager.setDefaultVariantKey(this.variantData.defaultKey);
                        this.variantManager.setInitialSelectionKey(this.variantData.defaultKey);
                    }
                    this.variantData.variantList.forEach(item => {
                        let oVariantItem = new VariantItem({
                            author: item.userId,
                            text: item.title,
                            key: item.key
                        });
                        this.variantManager.addVariantItem(oVariantItem);
                    })
                }
            },
            onSelectVariant: function (oEvent) {
                let sKey = oEvent.getParameter("key");
                let aFilterItems = this.filterBar.getFilterGroupItems();

                this.variantData.variantList.forEach(variantitem => {
                    if (sKey !== variantitem.key) return false;
                    variantitem.filterItems.forEach(variantFilterItem => {
                        let sVariantLabel = variantFilterItem.label;
                        let sVariantElementName = variantFilterItem.elementName;
                        let sVariantValue = variantFilterItem.value;

                        aFilterItems.forEach(filterItem => {
                            let {sFilterLabel, oFilterControl, sFilterElementName} = this.filterItemObj(filterItem);
                            if (sVariantLabel === sFilterLabel && sVariantElementName === sFilterElementName) {
                                filterSetting(sFilterElementName,sVariantValue,oFilterControl);
                            }
                        })
                    })
                });

                function filterSetting(elementName, value, control) {
                    switch (elementName) {
                        case "sap.m.Input":
                            if (value) return control.setValue(value)
                        case "sap.m.ComboBox":
                            if (value) return control.setSelectedKey(value)
                    }
                }

            },
            onVariantSave: function (oEvent) {
                let title = oEvent.getParameter("name");
                let key = oEvent.getParameter("key");
                let variantObj = { key, title, userId: this.sUserId, filterItems: [] };

                this.filterBar.getFilterGroupItems().forEach(filterItem => {
                    let {sFilterLabel,oFilterControl,sFilterElementName} = this.filterItemObj(filterItem);

                    variantObj.filterItems.push({
                        label: sFilterLabel,
                        elementName: sFilterElementName,
                        value: getFilterItemValue(oFilterControl, sFilterElementName)
                    });
                });
                this.createVariantData(variantObj);

                function getFilterItemValue(oControl, sElementName){
                    switch (sElementName) {
                        case "sap.m.Input":
                            if (oControl.getValue()) return oControl.getValue();
                        case "sap.m.ComboBox":
                            if (oControl.getSelectedKey()) return oControl.getSelectedKey();
                    }
                    return "";
                }                
            },
            filterItemObj : function(filterItem){
                let sFilterLabel = filterItem.getLabel();
                let oFilterControl = filterItem.getControl();
                let sFilterElementName = oFilterControl.getMetadata().getElementName();
                return {sFilterLabel, oFilterControl, sFilterElementName};
            },
            onManageChange : function(oEvent){
                let aVariantRenameObj = oEvent.getParameter("renamed");
                let aDeleteVariantKey = oEvent.getParameter("deleted");
                let sDefaultVariantKey = oEvent.getParameter("def");

                if(aDeleteVariantKey.length){
                    aDeleteVariantKey.forEach(deleteKey=>{
                        this.variantData.variantList = this.variantData.variantList.filter(variant=>{
                            return variant.key !== deleteKey
                        });
                    })                   
                }

                if(aVariantRenameObj.length){
                    aVariantRenameObj.forEach(renameObj=>{
                        let iSameIndex = this.variantData.variantList.findIndex(variant=> renameObj.key===variant.key);
                        this.variantData.variantList[iSameIndex].title = renameObj.name;
                    });
                }

                if(sDefaultVariantKey){
                    this.variantData.defaultKey = sDefaultVariantKey
                }
                this.setLocalStorage();
            },
            createVariantData : function(variantObj){
                let oViewId = this.getView().getId();
                if (this.variantData?.viewId && this.variantData.viewId === oViewId) {
                    this.variantData.variantList.push(variantObj);
                } else {
                    this.variantData = {
                        viewId: oViewId,
                        variantList: [variantObj]
                    };
                }
                this.setLocalStorage();
            },
            setLocalStorage: function () {            
                let oViewId = this.getView().getId();   
                window.localStorage.setItem(oViewId, JSON.stringify(this.variantData));
            },
            getLocalStorage: function () {
                let oViewId = this.getView().getId();
                return JSON.parse(window.localStorage.getItem(oViewId));
            },
            getRounter: function () {
                return this.getOwnerComponent().getRouter();
            },
            excelDownload: function (oEvent) {
                let oTable = oEvent.getSource().getParent().getParent();
                var EdmType = library.EdmType;
                let oView = this.getView();
                let aCols = [];
    
                let oRowBinding = oTable.getBinding("items");
                let oTableBindingInfo = oTable.getBindingInfo("items");
                let sTableModel = oTableBindingInfo.model;
                let oTamplateData = oTable.getModel(sTableModel).getData()[0];

                for(let p in oTamplateData){
                    let label = p;
                    let property = p;
                    let type;
                    
                    switch(typeof oTamplateData[p]){
                        case "string" : type = EdmType.String 
                        break;
                        case "number" : type = EdmType.Number
                        break;
                        case "date" : type = EdmType.Date
                        break;
                    }

                    if(!type) continue;
                    
                    aCols.push({label,property,type});
                }

                let oSettings = {
                    workbook : {
                        columns : aCols,
                        hierarchyLevel : "Level"				
                    },
                    dataSource : oRowBinding,
                    fileName : `${oTable.getHeaderText()}.xlsx`,
                    worker : false
                };
                
                let oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(()=>{
                    oSheet.destroy();
                })
            
            }
        });
    });
