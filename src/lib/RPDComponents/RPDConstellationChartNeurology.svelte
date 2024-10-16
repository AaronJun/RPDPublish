<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import "carbon-components-svelte/css/all.css";

  export let data: DataItem[] = [];
  
  interface DataItem {
    name: string;
    id: string;
    "Approved Drug": string;
    Purchased: string;
    Year: string;
  }

  let svg: SVGSVGElement;
  const width = 1200;
  const height = 1200;

  let outerRadius = Math.min(width, height) * 0.4; // Increased for better visibility

  const approvedDrugConcentricRadius = outerRadius * 0.9;
  const purchasedConcentricRadius = outerRadius * 0.7;
  const supportConcentricRadius = outerRadius * 0.5;
  const diseaseConcentricRadius = outerRadius * 0.3;

  const diseaseCircleRadius = 10;
  const supportCircleRadius = 3;
  const supportCircleOrbitRadius = 6;
  const purchasedCircleRadius = 6;
  const starSize = 150;

  const supportCircleColors = ['#C27FA4', '#80AEC2', '#DD9138'];

  let selectedItem: DataItem | null = null;
  let backgroundGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  
  const neurologyColor = "#1f77b4"; // Color for Neurology

  const supportLabels = ['Genetic Test', 'Registry', 'Advocacy Orgs'];

  function starPath(size: number, points: number): string {
    const rOuter = Math.sqrt(size);
    const rInner = rOuter * 0.45;
    const angle = Math.PI / points;

    let path = '';

    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const x = r * Math.sin(i * angle);
      const y = -r * Math.cos(i * angle);
      path += `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }

    return path + 'Z';
  }

  function createBackgroundCircles(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
    backgroundGroup = g.append('g').attr('class', 'background-circles');
    const radii = [diseaseConcentricRadius, supportConcentricRadius, purchasedConcentricRadius, approvedDrugConcentricRadius];
    
    radii.forEach(radius => {
      backgroundGroup.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#eee')
        .attr('stroke-width', 1); 
    });
  }

  function updateVisualization() {
    const svgElement = d3.select(svg);
    svgElement.selectAll('*').remove();

    const g = svgElement.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    createBackgroundCircles(g);

    // Filter data for Neurology only
    const neurologyData = data.filter(d => d.name.trim() === "Neurology");

    const angleStep = (2 * Math.PI) / neurologyData.length;

    neurologyData.forEach((d, i) => {
      const angle = i * angleStep;

      const diseaseGroup = g.append('g')
        .attr('class', 'disease-group')
        .attr('data-id', d.id)
        .attr('transform', `translate(${diseaseConcentricRadius * Math.cos(angle)}, ${diseaseConcentricRadius * Math.sin(angle)})`);

      diseaseGroup.append('circle')
        .attr('class', 'disease-circle')
        .attr('r', diseaseCircleRadius)
        .attr('fill', neurologyColor)
        .attr('opacity', 0.85);

      const supportCircleGroup = diseaseGroup.append('g')
        .attr('class', 'support-circle-group')
        .attr('transform', `translate(${(supportConcentricRadius - diseaseConcentricRadius) * Math.cos(angle)}, ${(supportConcentricRadius - diseaseConcentricRadius) * Math.sin(angle)})`);

      supportCircleGroup.append('circle')
        .attr('r', supportCircleOrbitRadius)
        .attr('fill', 'white')
        .attr('stroke', 'lightgrey')
        .attr('stroke-width', 0.6);

      supportLabels.forEach((_, index) => {
        const angleAttr = (index - 1) * (2 * Math.PI / 3);
        supportCircleGroup.append('circle')
          .attr('class', 'support-circle')
          .attr('r', supportCircleRadius)
          .attr('cx', supportCircleOrbitRadius * Math.cos(angleAttr))
          .attr('cy', supportCircleOrbitRadius * Math.sin(angleAttr))
          .attr('fill', supportCircleColors[index])
          .attr('stroke', supportCircleColors[index])
          .attr('stroke-width', 0.5);
      });

      const purchasedCircleGroup = diseaseGroup.append('g')
        .attr('class', 'purchased-circle-group')
        .attr('transform', `translate(${(purchasedConcentricRadius - diseaseConcentricRadius) * Math.cos(angle)}, ${(purchasedConcentricRadius - diseaseConcentricRadius) * Math.sin(angle)})`);

      purchasedCircleGroup.append('circle')
        .attr('class', 'purchased-circle')
        .attr('r', purchasedCircleRadius)
        .attr('fill', d.Purchased === "Y" ? neurologyColor : "white")
        .attr('stroke', neurologyColor)
        .attr('stroke-width', 0.5);

      const approvedDrugGroup = diseaseGroup.append('g')
        .attr('class', 'approved-drug-group')
        .attr('transform', `translate(${(approvedDrugConcentricRadius - diseaseConcentricRadius) * Math.cos(angle)}, ${(approvedDrugConcentricRadius - diseaseConcentricRadius) * Math.sin(angle)})`);

      approvedDrugGroup.append('path')
        .attr('class', 'approved-drug')
        .attr('d', starPath(starSize, 10))
        .attr('fill', d["Approved Drug"] === "Y" ? '#2C3E50' : '#fff')
        .attr('opacity', d["Approved Drug"] === "Y" ? '1' : '.5')
        .attr('stroke', '#2C3E50')
        .attr('stroke-width', d["Approved Drug"] === "Y" ? 0 : 0.2);

      diseaseGroup.append('text')
        .attr('class', 'disease-label')
        .attr('text-anchor', angle > Math.PI ? 'end' : 'start')
        .attr('transform', `rotate(${angle * 180 / Math.PI}) translate(${diseaseCircleRadius + 5}, 0) ${angle > Math.PI ? 'rotate(180)' : ''}`)
        .text(d.id)
        .attr('font-size', '8px')
        .attr('fill', neurologyColor);

      diseaseGroup
        .on('mouseover', (event) => handleMouseOver(event, diseaseGroup, d))
        .on('mouseout', (event) => handleMouseOut(event, diseaseGroup, d))
        .on('click', () => {
          if (selectedItem && selectedItem.id === d.id) {
            resetVisualization();
          } else {
            moveToCenter(diseaseGroup, d);
          }
        });
    });

    svgElement.on('click', (event) => {
      if (event.target === svg) {
        resetVisualization();
      }
    });
  }

  function handleMouseOver(event: MouseEvent, group: d3.Selection<SVGGElement, unknown, null, undefined>, item: DataItem) {
    d3.select(svg).selectAll('.disease-group').attr('opacity', 0.3);
    group.attr('opacity', 1);
    // You can add more interactivity here, like showing a tooltip
  }

  function handleMouseOut(event: MouseEvent, group: d3.Selection<SVGGElement, unknown, null, undefined>, item: DataItem) {
    d3.select(svg).selectAll('.disease-group').attr('opacity', 1);
  }

  function moveToCenter(group: d3.Selection<SVGGElement, unknown, null, undefined>, item: DataItem) {
    // Implement zoom-in functionality if needed
  }

  function resetVisualization() {
    updateVisualization();
  }

  onMount(() => {
    updateVisualization();
  });
</script>

<div class="visualization-container">
  <svg bind:this={svg} {width} {height}></svg>
</div>

<style>
  .visualization-container {
    position: relative;
  }
</style>