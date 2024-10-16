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

  const centerX = width / 2;
  const centerY = height / 2;

  const maxGroupRadius = Math.min(width, height) * 0.35;
  const diseaseCircleRadius = 6;
  const supportCircleRadius = 2;
  const supportCircleOrbitRadius = 4;
  const purchasedCircleRadius = 3;
  const starSize = 30;
  const minSpacing = 3;

  const supportCircleColors = ['#C27FA4', '#80AEC2', '#DD9138'];

  let selectedItem: DataItem | null = null;
  
  const colorMap: { [key: string]: string } = {
    "Neurology": "#1f77b4",
    "Hematology": "#ff7f0e",
    "Endocrinology": "#2ca02c",
    "Gastroenterology": "#d62728",
    "Oncology": "#9467bd",
    "Immunology": "#8c564b",
    "Pulmonology": "#e377c2",
    "Dermatology": "#AA9AFA",
    "Rheumatology": "#9DAFA2",
    "Cardiology": "#17becf",
    "Metabolic": "#bcbd22",
    "Ophthalmology": "#7f7f7f",
    "Nephrology": "#8c564b",
    "Orthopedics": "#e377c2",
    "Hepatology": "#7f7f7f",
    "Genetic": "#bcbd22"
  };

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

  function updateVisualization() {
    const svgElement = d3.select(svg);
    svgElement.selectAll('*').remove();

    const groupedData = d3.group(data, d => d.name.trim());
    const groups = Array.from(groupedData, ([key, value]) => ({ key, value }));

    const totalGroups = groups.length;
    const angleStep = (2 * Math.PI) / totalGroups;

    groups.forEach((group, i) => {
      const groupAngle = i * angleStep;
      const groupX = centerX + maxGroupRadius * Math.cos(groupAngle);
      const groupY = centerY + maxGroupRadius * Math.sin(groupAngle);

      const groupContainer = svgElement.append('g')
        .attr('transform', `translate(${groupX}, ${groupY})`);

      const itemCount = group.value.length;
      const itemAngleStep = (2 * Math.PI) / itemCount;
      const groupRadius = Math.min(maxGroupRadius * 0.3, (itemCount * (diseaseCircleRadius * 2 + minSpacing)) / (2 * Math.PI));

      group.value.forEach((d, j) => {
        const itemAngle = j * itemAngleStep;
        const x = groupRadius * Math.cos(itemAngle);
        const y = groupRadius * Math.sin(itemAngle);

        const diseaseGroup = groupContainer.append('g')
          .attr('class', 'disease-group')
          .attr('transform', `translate(${x}, ${y})`)
          .datum(d);

        diseaseGroup.append('circle')
          .attr('class', 'disease-circle')
          .attr('r', diseaseCircleRadius)
          .attr('fill', colorMap[group.key])
          .attr('opacity', 0.85);

        // Support circles
        const supportGroup = diseaseGroup.append('g')
          .attr('class', 'support-group');

        supportLabels.forEach((_, index) => {
          const angleAttr = (index - 1) * (2 * Math.PI / 3);
          supportGroup.append('circle')
            .attr('class', 'support-circle')
            .attr('r', supportCircleRadius)
            .attr('cx', supportCircleOrbitRadius * Math.cos(angleAttr))
            .attr('cy', supportCircleOrbitRadius * Math.sin(angleAttr))
            .attr('fill', supportCircleColors[index])
            .attr('stroke', supportCircleColors[index])
            .attr('stroke-width', 0.5);
        });

        // Purchased circle
        diseaseGroup.append('circle')
          .attr('class', 'purchased-circle')
          .attr('r', purchasedCircleRadius)
          .attr('cx', diseaseCircleRadius + purchasedCircleRadius + minSpacing)
          .attr('cy', 0)
          .attr('fill', d.Purchased === "Y" ? colorMap[group.key] : "white")
          .attr('stroke', colorMap[group.key])
          .attr('stroke-width', 0.5);

        // Approved drug star
        diseaseGroup.append('path')
          .attr('class', 'approved-drug')
          .attr('d', starPath(starSize, 5))
          .attr('transform', `translate(${-diseaseCircleRadius - minSpacing}, 0) scale(0.5)`)
          .attr('fill', d["Approved Drug"] === "Y" ? '#2C3E50' : '#fff')
          .attr('opacity', d["Approved Drug"] === "Y" ? '1' : '.5')
          .attr('stroke', '#2C3E50')
          .attr('stroke-width', d["Approved Drug"] === "Y" ? 0 : 0.2);

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

      // Add group label
      groupContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', groupRadius + 20)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(group.key);
    });
  }

  function handleMouseOver(event: MouseEvent, group: d3.Selection<SVGGElement, DataItem, null, undefined>, item: DataItem) {
    group.raise()
      .transition()
      .duration(200)
      .attr('transform', 'scale(1.5)');

    selectedItem = item;
    updateSidebar(item);
  }

  function handleMouseOut(event: MouseEvent, group: d3.Selection<SVGGElement, DataItem, null, undefined>, item: DataItem) {
    group.transition()
      .duration(200)
      .attr('transform', 'scale(1)');

    selectedItem = null;
    updateSidebar(null);
  }

  function moveToCenter(group: d3.Selection<SVGGElement, DataItem, null, undefined>, item: DataItem) {
    // Implement zoom-in functionality if needed
  }

  function resetVisualization() {
    // Implement reset functionality if needed
  }

  function updateSidebar(item: DataItem | null = null) {
    const event = new CustomEvent('sidebarUpdate', {
      detail: item,
    });
    window.dispatchEvent(event);
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