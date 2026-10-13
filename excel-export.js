/**
 * Berkeley KPI Agent - Formatted Excel (.xlsx / XML Spreadsheet) Exporter
 * Generates an executive workbook with side-by-side Client vs Berkeley vs Final scores
 */

const ExcelExporter = {
  exportMonthlyKpiExcel: function(record, template) {
    const siteName = record.siteName || template.siteName;
    const clientName = record.clientName || template.clientName;
    const month = record.month;
    const version = record.currentVersion;
    const isFreezed = record.status === 'freezed' || record.status === 'Approved & Freezed';
    const isUnderBerkeley = record.status === 'under_berkeley' || record.status === 'Under Review - Berkeley';
    const isUnderClient = record.status === 'under_client' || record.status === 'Under Review - Client';
    const status = isFreezed ? 'APPROVED & FREEZED (MUTUALLY AGREED)' : (isUnderBerkeley ? 'UNDER REVIEW - BERKELEY' : (isUnderClient ? 'UNDER REVIEW - CLIENT' : 'CLIENT DRAFT'));

    let totalMax = template.maxTotalScore || 100;
    let totalClient = 0;
    let totalBerkeley = 0;
    let totalFinal = 0;

    let rowsXml = "";

    template.categories.forEach(cat => {
      cat.kpis.forEach(k => {
        const item = record.items[k.id] || {};
        const clientScore = Number(item.clientScore || 0);
        const berkeleyScore = Number(item.berkeleyScore !== undefined ? item.berkeleyScore : clientScore);
        const finalScore = Number(item.finalScore !== undefined ? item.finalScore : berkeleyScore);

        totalClient += clientScore;
        totalBerkeley += berkeleyScore;
        totalFinal += finalScore;

        const achievementPct = k.maxScore > 0 ? Math.round((finalScore / k.maxScore) * 100) : 0;

        rowsXml += `
        <Row>
          <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${k.id}</Data></Cell>
          <Cell ss:StyleID="sData"><Data ss:Type="String">${this.escapeXml(cat.code + ' - ' + cat.name)}</Data></Cell>
          <Cell ss:StyleID="sDataBold"><Data ss:Type="String">${this.escapeXml(k.title)}</Data></Cell>
          <Cell ss:StyleID="sData"><Data ss:Type="String">${this.escapeXml(k.description)}</Data></Cell>
          <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${k.classification}</Data></Cell>
          <Cell ss:StyleID="sDataNumber"><Data ss:Type="Number">${k.maxScore}</Data></Cell>
          <Cell ss:StyleID="sClientScore"><Data ss:Type="Number">${clientScore}</Data></Cell>
          <Cell ss:StyleID="sData"><Data ss:Type="String">${this.escapeXml(item.clientRemarks || 'None')}</Data></Cell>
          <Cell ss:StyleID="sBerkeleyScore"><Data ss:Type="Number">${berkeleyScore}</Data></Cell>
          <Cell ss:StyleID="sData"><Data ss:Type="String">${this.escapeXml(item.berkeleyJustification || 'None')}</Data></Cell>
          <Cell ss:StyleID="sData"><Data ss:Type="String">${this.escapeXml(item.berkeleyAttachment || 'None')}</Data></Cell>
          <Cell ss:StyleID="sFinalScore"><Data ss:Type="Number">${finalScore}</Data></Cell>
          <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${achievementPct}%</Data></Cell>
        </Row>`;
      });
    });

    const overallPct = totalMax > 0 ? ((totalFinal / totalMax) * 100).toFixed(1) : 0;

    const excelTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Roboto" ss:Size="10" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="sTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Roboto" ss:Size="15" ss:Bold="1" ss:Color="#0f172a"/>
   <Interior ss:Color="#f8fafc" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sMetaLabel">
   <Font ss:FontName="Roboto" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="sMetaValue">
   <Font ss:FontName="Roboto" ss:Size="10" ss:Bold="1" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="sHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Roboto" ss:Size="10" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#2E3092" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="sData">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
  </Style>
  <Style ss:ID="sDataBold">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Font ss:FontName="Roboto" ss:Size="10" ss:Bold="1" ss:Color="#0f172a"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
  </Style>
  <Style ss:ID="sDataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
  </Style>
  <Style ss:ID="sDataNumber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
   <Font ss:FontName="Roboto" ss:Size="10" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
  </Style>
  <Style ss:ID="sClientScore">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
   <Font ss:FontName="Roboto" ss:Size="10" ss:Bold="1" ss:Color="#1e40af"/>
   <Interior ss:Color="#eff6ff" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#bfdbfe"/>
   </Borders>
  </Style>
  <Style ss:ID="sBerkeleyScore">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
   <Font ss:FontName="Roboto" ss:Size="10" ss:Bold="1" ss:Color="#92400e"/>
   <Interior ss:Color="#fef3c7" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#fde68a"/>
   </Borders>
  </Style>
  <Style ss:ID="sFinalScore">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
   <Font ss:FontName="Roboto" ss:Size="11" ss:Bold="1" ss:Color="#006738"/>
   <Interior ss:Color="#dcfce7" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86efac"/>
   </Borders>
  </Style>
  <Style ss:ID="sTotalRow">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Roboto" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#0f172a" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sTotalNumber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Roboto" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#0f172a" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Monthly KPI Evaluation">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="70"/>
   <Column ss:Width="160"/>
   <Column ss:Width="180"/>
   <Column ss:Width="260"/>
   <Column ss:Width="80"/>
   <Column ss:Width="75"/>
   <Column ss:Width="85"/>
   <Column ss:Width="200"/>
   <Column ss:Width="95"/>
   <Column ss:Width="220"/>
   <Column ss:Width="160"/>
   <Column ss:Width="85"/>
   <Column ss:Width="95"/>

   <!-- Header Title Block -->
   <Row ss:Height="30">
    <Cell ss:MergeAcross="12" ss:StyleID="sTitle"><Data ss:Type="String">BERKELEY KPI AGENT - MONTHLY KPI PERFORMANCE EVALUATION REPORT</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Contract Site:</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${this.escapeXml(siteName)}</Data></Cell>
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Client:</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${this.escapeXml(clientName)}</Data></Cell>
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Period:</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${month}</Data></Cell>
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Status:</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${status} (${version})</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="sMetaValue"><Data ss:Type="String">Reference ID: ${record.recordId}</Data></Cell>
   </Row>
   <Row><Cell/></Row>

   <!-- Column Headers -->
   <Row ss:Height="28">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">KPI ID</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Section / Element</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Performance Indicator</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Description &amp; Scope</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Classification</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Max Weight</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Client Score</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Client Remarks &amp; Observations</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Berkeley Score</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Berkeley Technical Justification</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Proof / Evidence Attached</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Final Agreed Score</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Achieved %</Data></Cell>
   </Row>

   <!-- Data Rows -->
   ${rowsXml}

   <!-- Totals Row -->
   <Row ss:Height="25">
    <Cell ss:MergeAcross="4" ss:StyleID="sTotalRow"><Data ss:Type="String">MONTHLY TOTALS &amp; AGGREGATES</Data></Cell>
    <Cell ss:StyleID="sTotalNumber"><Data ss:Type="Number">${totalMax}</Data></Cell>
    <Cell ss:StyleID="sTotalNumber"><Data ss:Type="Number">${totalClient}</Data></Cell>
    <Cell ss:StyleID="sTotalRow"><Data ss:Type="String">Client Evaluated</Data></Cell>
    <Cell ss:StyleID="sTotalNumber"><Data ss:Type="Number">${totalBerkeley}</Data></Cell>
    <Cell ss:StyleID="sTotalRow"><Data ss:Type="String">Berkeley Justified</Data></Cell>
    <Cell ss:StyleID="sTotalRow"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="sTotalNumber"><Data ss:Type="Number">${totalFinal}</Data></Cell>
    <Cell ss:StyleID="sTotalNumber"><Data ss:Type="String">${overallPct}%</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Berkeley_KPI_${siteName.replace(/[^a-z0-9]/gi, '_')}_${month}_${version}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  escapeXml: function(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExcelExporter;
}
