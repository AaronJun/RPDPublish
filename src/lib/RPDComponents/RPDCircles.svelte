<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import scrollama from 'scrollama';
  
    export let data: Array<{ Year: string; RPD: string }>;
  
    let container: HTMLElement;
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    let scroller: scrollama.ScrollamaInstance;
    let currentStep = -1;
  
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const packPadding = 10;
  
    $: width = container?.clientWidth ?? 800;
    $: height = 600; // Fixed height
  
    function createVisualization() {
      if (!container) return;
  
      svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('position', 'sticky')
        .style('top', '0')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      const hierarchy = {
        name: "RPD",
        children: data.map(d => ({
          name: d.Year,
          children: Array(parseInt(d.RPD)).fill(1).map(() => ({ name: "RPD" }))
        }))
      };
  
      const root = d3.hierarchy(hierarchy)
        .sum(d => d.name === "RPD" ? 1 : 0)
        .sort((a, b) => b.value - a.value);
  
      const pack = d3.pack()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
        .padding(packPadding);
  
      const packedData = pack(root);
  
      packedData.children.forEach((yearNode, i) => {
        const yearGroup = svg.append('g')
          .attr('class', `year-${yearNode.data.name}`)
          .style('opacity', 0);
  
        yearGroup.append('circle')
          .attr('cx', yearNode.x)
          .attr('cy', yearNode.y)
          .attr('r', yearNode.r)
          .attr('fill', '#e0f2f1')
          .attr('stroke', '#1C1C2F')
          .attr('stroke-width', 2);
  
        yearGroup.append('text')
          .attr('x', yearNode.x)
          .attr('y', yearNode.y)
          .attr('dy', '0.3em')
          .style('text-anchor', 'middle')
          .style('font-size', `${yearNode.r / 3}px`)
          .style('font-weight', 'bold')
          .text(yearNode.data.name);
  
        yearNode.children.forEach((child, j) => {
          yearGroup.append('circle')
            .attr('cx', child.x)
            .attr('cy', child.y)
            .attr('r', 0)  // Start with radius 0
            .attr('fill', '#43887F');
        });
      });
  
      setupScrollama();
    }
  
    function setupScrollama() {
      scroller = scrollama();
  
      scroller
        .setup({
          step: '.step',
          offset: 0.5,
          debug: true
        })
        .onStepEnter(handleStepEnter)
        .onStepExit(handleStepExit);
    }
  
    function handleStepEnter({ index, direction }) {
      console.log(`Entering step ${index}, direction: ${direction}`);
      currentStep = index;
      const year = data[index].Year;
      const yearGroup = svg.select(`.year-${year}`);
  
      yearGroup.transition().duration(500).style('opacity', 1);
  
      const circles = yearGroup.selectAll('circle');
      circles.each(function(d, i) {
        if (i === 0) return;  // Skip the year circle
        d3.select(this)
          .transition()
          .delay(i * 100)
          .duration(500)
          .attr('r', d => d.r);  // Animate to full radius
      });
    }
  
    function handleStepExit({ index, direction }) {
      console.log(`Exiting step ${index}, direction: ${direction}`);
      if (direction === 'up') {
        const year = data[index].Year;
        const yearGroup = svg.select(`.year-${year}`);
  
        yearGroup.transition().duration(500).style('opacity', 0);
  
        const circles = yearGroup.selectAll('circle');
        circles.each(function(d, i) {
          if (i === 0) return;  // Skip the year circle
          d3.select(this)
            .transition()
            .duration(500)
            .attr('r', 0);  // Animate back to radius 0
        });
      }
    }
  
    onMount(() => {
      createVisualization();
    });
  </script>
  
  <div class="rpd-circles-container">
    <div bind:this={container} class="svg-container"></div>
    <div class="steps-container">
      {#each data as item, i}
        <div class="step" data-step={i}>
          <p>{item.Year}: {item.RPD} RPDs</p>
          {#if i === currentStep}
            <span class="current-step-indicator">Current Step</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .rpd-circles-container {
      width: 100%;
      display: flex;
    }
  
    .svg-container {
      width: 60%;
      height: 600px;
      position: sticky;
      top: 0;
    }
  
    .steps-container {
      width: 40%;
    }
  
    .step {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      font-weight: bold;
      border: 1px solid #ccc;
      margin: 10px 0;
      padding: 20px;
    }
  
    .current-step-indicator {
      color: red;
      font-size: 0.8em;
      margin-top: 10px;
    }
  </style>