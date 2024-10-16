<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import "carbon-components-svelte/css/all.css";
  
    export let rpdPrvData: any[];
    export let constellationData: any[];
    export let currentYear: string;
  
    let summaryData: any[] = [];
    let chart: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  
    $: currentYearData = summaryData.find(data => data.year === currentYear) || {};
    $: isOverview = currentYear === "Overview";
  
    $: totalRPDDesignations = isOverview ? summaryData.reduce((sum, data) => sum + data.rpdDesignations, 0) : currentYearData.rpdDesignations || 0;
    $: totalVouchersAwarded = isOverview ? summaryData.reduce((sum, data) => sum + data.vouchersAwarded, 0) : currentYearData.vouchersAwarded || 0;
    $: totalVouchersSold = isOverview ? summaryData.reduce((sum, data) => sum + data.vouchersSold, 0) : currentYearData.vouchersSold || 0;
    $: totalVoucherSalesAmount = isOverview ? summaryData.reduce((sum, data) => sum + data.voucherSalesTotal, 0) : currentYearData.voucherSalesTotal || 0;
  
    onMount(() => {
      processData();
    });  
  
    function processData() {
      summaryData = rpdPrvData.map(yearData => {
        const year = yearData.Year;
        const yearConstellationData = constellationData.filter(item => item.Year === year);
        
        const vouchersAwarded = yearConstellationData.length;
        const vouchersSold = yearConstellationData.filter(item => item.Purchased.toLowerCase() === 'y').length;
        const voucherSalesTotal = yearConstellationData.reduce((total, item) => {
          const salePrice = parseFloat(item["Sale  Price (USD, Millions)"]) || 0;
          return total + salePrice;
        }, 0);
  
        return {
          year,
          rpdDesignations: parseInt(yearData.RPD) || 0,
          vouchersAwarded,
          vouchersSold,
          voucherSalesTotal
        };
      });
    }
  
    function formatNumber(num: number): string {
    return num.toLocaleString();
  }
  </script>

  <div class="summary-card">
  
    <p class="summary-sentence">
      There were <span class="highlight">{formatNumber(totalRPDDesignations)} </span> RPD designations and <span class="highlight">{formatNumber(totalVouchersAwarded)}</span> priority review vouchers awarded.
      <span class="highlight">{formatNumber(totalVouchersSold)}</span> vouchers were sold for a total of <span class="highlight">${formatNumber(totalVoucherSalesAmount.toFixed(2))} million.</span>
    </p>  
  </div>
  
  <style>
  
    .highlight {
      padding-left: 0.125rem;
      padding-right: 0.15rem;
      font-size: 1rem;
      font-family: 'IBM Plex Mono', monospace;
      color: #C9623F;
      text-decoration: dotted underline;
      font-weight: 800;
    }
  
      .summary-title {
        font-size: 1.25rem;
      }
  
      .summary-sentence {
        font-size: 1rem;
      }
  
  </style>