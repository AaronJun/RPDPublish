<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import RadialTimeline from '$lib/RPDComponents/RadialTimeline.svelte';
  import SimpleDrawer from '$lib/RPDComponents/RPDDrawer.svelte';
  import SummaryDisplay from '$lib/RPDComponents/RPDPageSummary.svelte';
  import YearlySummary from '$lib/RPDComponents/RPDYearSummary.svelte';
  import NavigationGuide from '$lib/RPDComponents/RPDNavGuide.svelte';
  import TherapeuticAreaLegend from '$lib/RPDComponents/RPDLegend.svelte';

  import rpdPrvDataRaw from '../data/RPDPRVOverviewData.json';
  import constellationDataRaw from '../data/RPDConstellationData.json';

  let width = 1850;
  let height = 1850;
  let currentYear = "Overview";
  let hoveredYear = "Overview";
  let showEndScreen = false;
  let showStartScreen = true;
  let timelineComponent: RadialTimeline;
  let svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  let isDrawerOpen = false;
  let selectedData: any = null;
  let selectedColor = '';
  let isZoomed = false;
  let hoveredPetalData: any = null;
  let drawerView = 'entry';
  

  const therapeuticAreaColors: { [key: string]: string } = {
    "Gastroenterology": "#39FF14",
    "Neurology": "#4D4DFF",
    "Ophthalmology": "#E79028",
    "Immunology": "#EA38A5",
    "Metabolic": "#133B11",
    "Dermatology": "#559368",
    "Hematology": "#CF3630",
    "Orthopedics": "#441780",
    "Pulmonology": "#CBC09F",
    "Nephrology": "#ACA3DB",
    "Oncology": "#FF84DE",
    "Genetic": "#4D4DFF",
    "Hepatology": "#FF00D4",
  };

  function getColor(name: string): string {
    return therapeuticAreaColors[name] || "#000000";
  }

  function calculateAverageRPD(data, targetYear) {
    const lastFiveYears = data
      .filter(item => +item.Year >= targetYear - 5 && +item.Year < targetYear)
      .filter(item => item.RPD && item.RPD !== "0");
    
    if (lastFiveYears.length === 0) return 0;
    
    const sum = lastFiveYears.reduce((acc, curr) => acc + parseInt(curr.RPD), 0);
    return Math.round(sum / lastFiveYears.length);
  }

  // Process RPD PRV data
  const processedRpdPrvData = rpdPrvDataRaw.map(item => {
    if (!item.RPD || item.RPD === "0") {
      const averageRPD = calculateAverageRPD(rpdPrvDataRaw, parseInt(item.Year));
      return {
        ...item,
        RPD: averageRPD.toString(),
        "RPD PRV": item["RPD PRV"] || "0"
      };
    }
    return item;
  });

  // Fill in missing years
  const currentDate = new Date().getFullYear();
  for (let year = 2021; year <= currentDate; year++) {
    if (!processedRpdPrvData.find(item => item.Year === year.toString())) {
      const averageRPD = calculateAverageRPD(processedRpdPrvData, year);
      processedRpdPrvData.push({
        Year: year.toString(),
        RPD: averageRPD.toString(),
        "RPD PRV": "0"
      });
    }
  }

  // Sort the data
  processedRpdPrvData.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));

  // Process constellation data (if needed)
  const processedConstellationData = constellationDataRaw;

  function handleClusterElementClick(event) {
    const { entry, color } = event.detail;
    selectedData = entry;
    selectedColor = color;
    isDrawerOpen = true;
    drawerView = 'entry';
    hoveredPetalData = {
      name: entry.name,
      id: entry.id,
      drugName: entry["Drug Name"]
    };
  }
  function handleClusterElementDoubleClick(event) {
    const { entry, color } = event.detail;
    selectedData = entry;
    selectedColor = color;
    isDrawerOpen = true;
    drawerView = 'entry';
    hoveredPetalData = {
      name: entry.name,
      id: entry.id,
      drugName: entry["Drug Name"]
    };
  }


  function handleYearChange(event) {
    currentYear = event.detail.year;
    hoveredYear = event.detail.year;
    console.log('Year changed:', currentYear);
    // Close the drawer if it's open
    if (isDrawerOpen) {
      closeDrawer();
    }
  }
  
  function handleYearHover(event) {
    hoveredYear = event.detail.year;
    console.log('Year hovered:', hoveredYear);
  }

  function handleStartScreenExplore() {
    showStartScreen = false;
  }

  function handleSponsorClick(event) {
    const { sponsor } = event.detail;
    selectedData = { Sponsor: sponsor };
    selectedColor = getColor(sponsor);
    isDrawerOpen = true;
    drawerView = 'sponsor';
  }

  function handleNextYear() {
    if (timelineComponent) {
      timelineComponent.navigate('next');
    }
  }

  function handlePrevYear() {
    if (timelineComponent) {
      timelineComponent.navigate('prev');
    }
  }

  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && isZoomed) {
      resetZoom();
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      handlePrevYear();
    }
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      handleNextYear();
    }
  }

  function resetZoom() {
    if (timelineComponent) {
      timelineComponent.resetZoom();
    }
    isZoomed = false;
  }

  function handlePetalHover(event) {
    hoveredPetalData = event.detail;
  }

  function handlePetalLeave() {
    if (!isDrawerOpen) {
      hoveredPetalData = null;
    }
  }

  function handleRowClick(event) {
    const { entry } = event.detail;
    handleClusterElementClick({ detail: { entry, color: getColor(entry.name) } });
  }

  function handleRowHover(event) {
    const { entry } = event.detail;
    hoveredPetalData = {
      name: entry.name,
      id: entry.id,
      drugName: entry["Drug Name"]
    };
  }

  function handleRowLeave() {
    if (!isDrawerOpen) {
      hoveredPetalData = null;
    }
  }

  function closeDrawer() {
    isDrawerOpen = false;
    selectedData = null;
    hoveredPetalData = null;
    drawerView = 'entry';
  }

  onMount(() => {
    svg = d3.select("#radial-timeline")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="full-width-header">
  <div class="content-column-header">
    <h3>A Data Narrative</h3>
    <h1>Planting the seeds of rare disease treatment</h1>
  </div>
</div>

<div class="main-content">
  <div class="content-summary-insert">
    <div class="content-column-display">
      <span class="current-year">{currentYear}</span>
    
      <SummaryDisplay
        currentYear={currentYear}
        constellationData={processedConstellationData}
        rpdPrvData={processedRpdPrvData}
      />
      
      <div id="timeline-controls">
        <button on:click={handlePrevYear} disabled={currentYear === "Overview"}>
          Prev
        </button>
        <button on:click={handleNextYear} disabled={currentYear === processedRpdPrvData[processedRpdPrvData.length - 1].Year}>
          Next
        </button>
      </div>

      <div class="spacer-line" />
      
    
    <YearlySummary 
      constellationData={processedConstellationData} 
      currentYear={currentYear}
      hoveredPetalData={hoveredPetalData}
      isDrawerOpen={isDrawerOpen}
      selectedData={selectedData}
      on:rowClick={handleRowClick}
      on:rowHover={handleRowHover}
      on:rowLeave={handleRowLeave}
      on:sponsorClick={handleSponsorClick}
    />
    </div>

  </div> 
  
  <div class="timeline-wrapper">
    <RadialTimeline 
      bind:this={timelineComponent}
      data={processedRpdPrvData} 
      constellationData={processedConstellationData}
      on:yearChange={handleYearChange}
      on:yearHover={handleYearHover}
      on:clusterElementClick={handleClusterElementClick}
      on:petalHover={handlePetalHover}
      on:petalLeave={handlePetalLeave}
    />
    <div class="spacer-line" />
  </div>
  
  <NavigationGuide />
</div>
<TherapeuticAreaLegend {therapeuticAreaColors} />

{#if isDrawerOpen && selectedData}
<SimpleDrawer 
  bind:isOpen={isDrawerOpen} 
  data={selectedData} 
  constellationData={processedConstellationData}
  color={selectedColor}
  onClose={closeDrawer}
  view={drawerView}
/>
{/if}

<style>
  .full-width-header {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 2rem 1rem 1.25rem 1rem;
    border-bottom: 1px dotted #292F58;
    justify-content: space-between;
    align-items: flex-start;
  }

  .content-column-header {
    flex: 1;
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 4fr;
    height: calc(95vh);
    width: 97.25vw;
    overflow: hidden;
  }

  .timeline-wrapper {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  h1 {
    font-weight: 200;
    text-transform: capitalize;
    font-size: 1.745rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-weight: 800;
    text-transform: uppercase;
    font-size: .65rem;
    color: #C9623F;
    margin-bottom: .65rem;
  }

  .content-column-display {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    padding: 1rem 0rem 0rem 0rem;
    overflow-y: auto;
    border-bottom: 1px dotted #292F58;
    z-index: 100;
  }

  .content-summary-insert {
    display: flex;
    flex-direction: column;
    padding: 2rem 1rem 5rem 1.25rem;
    border-bottom: 0.25px solid #292F58;
    background-color: #f8f9fa;
    border-right: 1px dotted #292F58;
    max-height: auto;
    justify-content: space-between;
    overflow-y: auto;
  }

  #timeline-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: left;
    padding: 1rem 0 1rem 0;
    justify-content: first first baseline;
    z-index: 1000;
  }

  #timeline-controls button {
        background-color: #C9623F;
        color: white;
        border: none;
        padding: 5px 7.25px;
        min-width: 5vw;
        border-radius: 100px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    #timeline-controls button:hover {
        background-color: #A34E32;
    }

  .current-year {
    font-weight: 800;
    text-transform: uppercase;
    font-size: .65rem;
    color: #C9623F;
    margin-bottom: .65rem;
  }

  .spacer-line {
    border-bottom: 1px dotted #292F58;
    margin: 1rem 0;
  }
</style>