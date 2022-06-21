sap.ui.define([
  "gw/controller/BaseController.controller",
  "../model/formatter",
  'sap/viz/ui5/format/ChartFormatter',
], function (BaseController, formatter, ChartFormatter) {
  "use strict";

  return BaseController.extend("gw.controller.SalesOrder", {
    formatter: formatter,
    onInit: function () {
      this.router = this.getOwnerComponent().getRouter();
      this.router.getRoute("SalesOrder").attachPatternMatched(this._onObjectMatched, this);
    },
    _onObjectMatched: function (oEvent) {
      let oView = this.getView();
      let sPartnerID = oEvent.getParameter("arguments").partnerID
      oView.bindElement({
        path: "/" + sPartnerID,
        model: "partner"
      });
      this._oDataCall();
      this.setVariant();
    },
    _oDataCall: function () {
      let _self = this;
      let oView = this.getView();
      let oFilterBar = oView.byId("filterbar");
      let aFilters = [];

      oFilterBar.getFilterGroupItems().forEach(filterbar => {
        let label = filterbar.getLabel();
        let oControl = filterbar.getControl();
        let sElementName = oControl.getMetadata().getElementName();
        switch (sElementName) {
          case "sap.m.Input":
            if (oControl.getValue()) {
              aFilters.push(new sap.ui.model.Filter(label, "Contains", oControl.getValue()))
            }
            break;
          case "sap.m.ComboBox":
            if (oControl.getSelectedKey()) {
              aFilters.push(new sap.ui.model.Filter(label, "EQ", oControl.getSelectedKey()))
            }
            break;
        }
      });

      oView.getModel().read("/SalesOrderSet", {
        filters: aFilters,
        success: function (oData) {

          let aLifecycle = oData.results.map(data => {
            return {
              SalesOrderID: data.SalesOrderID,
              LifecycleStatusDescription: data.LifecycleStatusDescription,
              LifecycleStatus: data.LifecycleStatus
            }
          })

          let aAmount = oData.results.map(data => {
            return {
              CustomerID: data.CustomerID,
              GrossAmount: parseFloat(data.GrossAmount),
              NetAmount: parseFloat(data.NetAmount),
              TaxAmount: parseFloat(data.TaxAmount)
            }
          }).splice(0, 10);
          console.log(aAmount);

          let oSalesModel = new sap.ui.model.json.JSONModel({
            status: aLifecycle,
            amount: aAmount
          });

          oView.setModel(oSalesModel, "sales");
          let oVizFrame = oView.byId("oVizFrame");
          //let formatPattern = ChartFormatter.DefaultPattern;
          oVizFrame.setVizProperties({
            plotArea: {
              dataLabel: {
                showTotal: true
              }
            },
              title: {
                visible: false
              },
              dataLabel: {
                visible: true
              },
              valueAxis: {
                visible: true,
                title: {
                  visible: false
                }
              }
          });

          var oPopOver = oView.byId("idPopOver");
          oPopOver.connect(oVizFrame.getVizUid());
          //oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
        },
        error: function (oErr) {
          console.log(oErr);
        }
      })
    }
  });
}
);
