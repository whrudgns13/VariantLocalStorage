sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/comp/variants/VariantItem"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Fragment, VariantItem) {
        "use strict";

        return Controller.extend("gw.controller.BaseController", {
            onInit: function () {

            },
            setVariant: function () {
                let oView = this.getView();
                this.filterBar = oView.byId("filterbar");
                this.sUserId = sap.ushell.Container.getService("UserInfo").getUser().getId();
                this.variantManager = oView.byId("variantManager");
                this.variantData = this.getLocalStorage();

                if (this.variantData) {
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
                this.setLocalStorage(variantObj);

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
            setLocalStorage: function (variantObj) {
                let oViewId = this.getView().getId();
                if (this.variantData?.viewId && this.variantData.viewId === oViewId) {
                    this.variantData.variantList.push(variantObj);
                } else {
                    this.variantData = {
                        viewId: oViewId,
                        variantList: [variantObj]
                    };
                }
                window.localStorage.setItem(oViewId, JSON.stringify(this.variantData));
            },
            getLocalStorage: function () {
                let oViewId = this.getView().getId();
                return JSON.parse(window.localStorage.getItem(oViewId));
            },
            getRounter: function () {
                return this.getOwnerComponent().getRouter();
            }
        });
    });
