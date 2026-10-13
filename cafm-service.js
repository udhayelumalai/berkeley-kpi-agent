/**
 * Berkley CAFM Integration Adapter
 * Handles data synchronization between Berkley KPI Portal and CAFM System
 */
const CafmService = {
  // Simulated CAFM Database & Sync settings
  settings: {
    apiUrl: "https://cafm.berkley-services.ae/api/v1",
    apiKey: "bk_live_9a87f2b3e4c1",
    autoSync: true
  },

  // Simulated CAFM real-time monthly statistics pulled for sites
  fetchSiteCafmStats: async function(siteId, month) {
    // In production, this performs fetch(`${this.settings.apiUrl}/stats?site=${siteId}&month=${month}`)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return realistic site operational data
        const mockData = {
          "site-01": { // Yas Mall
            reactiveTicketsTotal: 342,
            reactiveTicketsOnTime: 331,
            reactiveSlaPercent: 96.8, // >= 95% -> Score 4
            ppmPlanned: 180,
            ppmCompleted: 178,
            ppmCompletionPercent: 98.9, // >= 98% -> Score 4
            customerComplaintsLogged: 0, // 0 breaches -> Score 3
            criticalAssetUptime: 99.98,
            innovationSuggestionsSubmitted: 2,
            sustainabilityInitiatives: 2,
            qualityAuditFindings: 0,
            staffIncentiveProgramsRun: 1,
            hseLostTimeInjuries: 0
          },
          "site-02": { // Miral HQ
            reactiveTicketsTotal: 84,
            reactiveTicketsOnTime: 82,
            reactiveSlaPercent: 97.6,
            ppmPlanned: 45,
            ppmCompleted: 45,
            ppmCompletionPercent: 100.0,
            customerComplaintsLogged: 0,
            criticalAssetUptime: 100.0,
            innovationSuggestionsSubmitted: 1,
            sustainabilityInitiatives: 1,
            qualityAuditFindings: 0,
            staffIncentiveProgramsRun: 1,
            hseLostTimeInjuries: 0
          }
        };

        const result = mockData[siteId] || {
          reactiveTicketsTotal: 120,
          reactiveTicketsOnTime: 114,
          reactiveSlaPercent: 95.0,
          ppmPlanned: 60,
          ppmCompleted: 59,
          ppmCompletionPercent: 98.3,
          customerComplaintsLogged: 0,
          criticalAssetUptime: 100.0,
          innovationSuggestionsSubmitted: 1,
          sustainabilityInitiatives: 1,
          qualityAuditFindings: 0,
          staffIncentiveProgramsRun: 1,
          hseLostTimeInjuries: 0
        };

        resolve(result);
      }, 300);
    });
  },

  // Sync complete monthly KPI evaluation back into CAFM
  syncEvaluationToCafm: async function(evaluationPayload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("[CAFM Connector] Pushed evaluation to CAFM system:", evaluationPayload);
        resolve({
          success: true,
          cafmRecordId: "CAFM-KPI-" + Math.floor(100000 + Math.random() * 900000),
          syncedAt: new Date().toISOString(),
          status: "COMMITTED"
        });
      }, 500);
    });
  },

  // Export as CAFM compatible JSON file
  exportToJson: function(data) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Berkley_CAFM_KPI_${data.siteId}_${data.month}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CafmService;
}
