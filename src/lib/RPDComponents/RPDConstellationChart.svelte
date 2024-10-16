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

  let outerRadius = Math.min(width, height) * 0.25;

  const approvedDrugConcentricRadius = outerRadius * 2.45;
  const purchasedConcentricRadius = outerRadius * 2;
  const supportConcentricRadius = outerRadius * 1.15;
  const diseaseConcentricRadius = outerRadius * .75;
  const therapeuticAreaConcentricRadius = outerRadius * .5;

  const maxDiseaseCircleRadius = 6;
  const minDiseaseCircleRadius = 6;
  const supportCircleRadius = 2;
  const supportCircleOrbitRadius = 4;
  const purchasedCircleRadius = 4;
  const starSize = 100;
  const minSpacing = 180;

  const supportCircleColors = ['#C27FA4', '#80AEC2', '#DD9138'];

  const scaleFactor = 2;

  let selectedItem: DataItem | null = null;
  let backgroundGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  let initialTransforms: { [key: string]: string } = {};
  let initialScales: { [key: string]: number } = {};
  let initialBackgroundRadii: number[] = [];
  let isDrawerOpen = false;
  
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

  function createBackgroundCircles(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
    backgroundGroup = g.append('g').attr('class', 'background-circles');
    initialBackgroundRadii = [diseaseConcentricRadius, supportConcentricRadius, purchasedConcentricRadius, approvedDrugConcentricRadius];
    
    initialBackgroundRadii.forEach(radius => {
      backgroundGroup.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#eee')
        .attr('stroke-width', 1); 
    });
  }

  let centralText: d3.Selection<SVGTextElement, unknown, null, undefined>;

  function updateVisualization() {
    const svgElement = d3.select(svg) as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    svgElement.selectAll('*').remove();

    const g = svgElement.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    createBackgroundCircles(g);

    centralText = g.append('text')
      .attr('class', 'central-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '.85rem')
      .attr('font-weight', '600');

    const groupedData = d3.group(data, d => d.name.trim());
    const groups = Array.from(groupedData, ([key, value]) => ({ key, value }));

    const radiusScale = d3.scaleLinear()
      .domain([0, d3.max(groups, g => g.value.length) || 0])
      .range([minDiseaseCircleRadius, maxDiseaseCircleRadius]);

    const totalCircumference = groups.reduce((acc, group) => {
      return acc + 2 * radiusScale(group.value.length) + minSpacing;
    }, 0);

    outerRadius = Math.max(outerRadius, totalCircumference / (2 * Math.PI));

    const angleScale = d3.scaleLinear()
      .domain([0, totalCircumference])
      .range([0, 2 * Math.PI]);

    let currentAngle = 0;

    const therapeuticAreaCircles = g.append('g')
      .attr('class', 'ta-circles');

    groups.forEach((group, i) => {
      const nameAngle = (i / groups.length) * 2 * Math.PI;
      const nameX = therapeuticAreaConcentricRadius * Math.cos(nameAngle);
      const nameY = therapeuticAreaConcentricRadius * Math.sin(nameAngle);

      const taCircle = therapeuticAreaCircles.append('g')
        .attr('transform', `translate(${nameX}, ${nameY})`);

      taCircle.append('path')
        .attr('d', starPath(starSize * scaleFactor/4, 4))
        .attr('fill', colorMap[group.key]);

      taCircle.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '2em')
        .attr('dx', '2em')
        .attr('font-weight', '800')
        .attr('font-size', '11px')
        .text(group.key)
        .attr('fill',colorMap[group.key]);

      const circleRadius = radiusScale(group.value.length);
      const angle = currentAngle + circleRadius / outerRadius - .5;

      group.value.forEach((d, j) => {
        const diseaseGroup = g.append('g')
          .attr('class', 'disease-group')
          .attr('data-id', d.id)
          .datum<{ id: string; angle: number; radius: number }>({ id: d.id, angle: angle, radius: circleRadius });

        initialTransforms[d.id] = `translate(${diseaseConcentricRadius * Math.cos(angle)}, ${diseaseConcentricRadius * Math.sin(angle)})`;
        initialScales[d.id] = circleRadius;

        diseaseGroup.attr('transform', initialTransforms[d.id]);

        diseaseGroup.append('line')
          .attr('class', 'connecting-line')
          .attr('x1', nameX - diseaseConcentricRadius * Math.cos(angle))
          .attr('y1', nameY - diseaseConcentricRadius * Math.sin(angle))
          .attr('x2', 0)
          .attr('y2', 0)
          .attr('stroke', colorMap[group.key])
          .attr('stroke-width', 1)
          .attr('opacity', .5);

        const diseaseCircleGroup = diseaseGroup.append('g');

        diseaseCircleGroup.append('circle')
          .attr('class', 'disease-circle')
          .attr('r', circleRadius)
          .attr('fill', colorMap[group.key])
          .attr('opacity', .85);

        
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
          .attr('fill', d.Purchased === "Y" ? colorMap[group.key] : "white")
          .attr('stroke', colorMap[group.key])
          .attr('stroke-width', 0.5);

        const approvedDrugGroup = diseaseGroup.append('g')
          .attr('class', 'approved-drug-group')
          .attr('transform', `translate(${(approvedDrugConcentricRadius - diseaseConcentricRadius) * Math.cos(angle)}, ${(approvedDrugConcentricRadius - diseaseConcentricRadius) * Math.sin(angle)})`);

        approvedDrugGroup.append('path')
          .attr('class', 'approved-drug')
          .attr('d', starPath(starSize * scaleFactor *.5, 10))
          .attr('fill', d["Approved Drug"] === "Y" ? '#2C3E50' : '#fff')
          .attr('opacity', d["Approved Drug"] === "Y" ? '1' : '.5')
          .attr('stroke', '#2C3E50')
          .attr('stroke-width', d["Approved Drug"] === "Y" ? 0 : 0.2);
      
        diseaseGroup
          .on('mouseover', (event) => {
            handleMouseOver(event, diseaseGroup, d);
          })
          .on('mouseout', (event) => {
            handleMouseOut(event, diseaseGroup, d);
          })
          .on('click', () => {
            if (selectedItem && selectedItem.id === d.id) {
              resetVisualization();
            } else {
              moveToCenter(diseaseGroup, d);
            }
          });
      });

      currentAngle += (2 * circleRadius + minSpacing) / outerRadius;
    });

    svgElement.on('click', (event) => {
      if (event.target === svg) {
        resetVisualization();
      }
    });

    updateSidebar();
  }

  function handleMouseOver(event: MouseEvent, group: d3.Selection<SVGGElement, { id: string; angle: number; radius: number; }, null, undefined>, item: DataItem) {
    const svgElement = d3.select(svg) as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    const duration = 200;

    selectedItem = item;

    svgElement.selectAll<SVGGElement, { id: string; angle: number; radius: number; }>('.disease-group, .ta-circles')
      .filter(function(this: SVGGElement) { return this !== group.node(); })
      .transition()
      .duration(duration)
      .style('cursor', 'pointer')
      .attr('opacity', 0.25);

    updateSidebar(item);
    
    centralText?.transition().text(item.id);
  }

  function handleMouseOut(event: MouseEvent, group: d3.Selection<SVGGElement, { id: string; angle: number; radius: number; }, null, undefined>, item: DataItem) {
    const svgElement = d3.select(svg) as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    const duration = 200;

    selectedItem = item;

    svgElement.selectAll<SVGGElement, { id: string; angle: number; radius: number; }>('.disease-group, .ta-circles')
      .filter(function(this: SVGGElement) { return this !== group.node(); })
      .transition()
      .duration(duration)
      .attr('opacity', 1);

    updateSidebar(null);

    centralText?.transition().duration(duration);
    }

  function moveToCenter(group: d3.Selection<SVGGElement, { id: string; angle: number; radius: number; }, null, undefined>, item: DataItem) {
    if (selectedItem) {
      resetVisualization();
    }

    const svgElement = d3.select(svg) as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    const duration = 500;

    selectedItem = item;
    isDrawerOpen = true;

    svgElement.selectAll<SVGGElement, { id: string; angle: number; radius: number; }>('.disease-group, .ta-circles')
      .filter(function(this: SVGGElement) { return this !== group.node(); })
      .transition()
      .duration(duration)
      .ease(d3.easeCircleIn)
      .attr('opacity', 0.05);

    group.raise()
      .transition()
      .duration(duration)
      .attr('transform', 'translate(50, 100)');

      group.select('.disease-circle')
      .transition()
      .duration(duration)
      .attr('r', outerRadius * 0.1)
      .attr('opacity', 1);

    const supportGroup = group.select('.support-circle-group');
    supportGroup.transition()
      .duration(duration)
      .attr('transform', 'translate(100, 0)')
      .attr('opacity', 1);

    supportGroup.selectAll('.support-circle')
      .transition()
      .duration(duration)
      .attr('r', outerRadius * 0.03)
      .attr('cx', (_, i) => outerRadius * 0.2 * Math.cos(i * 2 * Math.PI / 3))
      .attr('cy', (_, i) => outerRadius * 0.2 * Math.sin(i * 2 * Math.PI / 3));

    const purchasedGroup = group.select('.purchased-circle-group');
    purchasedGroup.transition()
      .duration(duration)
      .attr('transform', 'translate(0, 0)');

    purchasedGroup.select('.purchased-circle')
      .transition()
      .duration(duration)
      .attr('r', outerRadius * 0.05);

    const approvedDrugGroup = group.select('.approved-drug-group');
    approvedDrugGroup.transition()
      .duration(duration)
      .attr('transform', `translate(0, ${-outerRadius * 0.4})`);

    approvedDrugGroup.select('.approved-drug')
      .transition()
      .duration(duration)
      .attr('transform', 'scale(1.5)');

    backgroundGroup.selectAll('circle')
      .transition()
      .duration(duration)
      .attr('opacity', 0.2);
      
    updateSidebar(item);
  }

  function resetVisualization() {
    if (!selectedItem) return;

    const svgElement = d3.select(svg) as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    const duration = 500;

    svgElement.selectAll<SVGGElement, { id: string; angle: number; radius: number; }>('.disease-group')
      .transition()
      .duration(duration)
      .attr('opacity', .85)
      .attr('transform', function(d) {
        return initialTransforms[d.id] || null;
      });

    svgElement.selectAll('.disease-circle')
      .transition()
      .duration(duration)
      .attr('r', function(d: any) {
        return initialScales[d.id] || null;
      });

    svgElement.selectAll('.support-circle-group')
      .transition()
      .duration(duration)
      .attr('opacity', 1)
      .attr('transform', function(d: any) {
        const angle = d.angle;
        return `translate(${(supportConcentricRadius - diseaseConcentricRadius) * Math.cos(angle)}, ${(supportConcentricRadius - diseaseConcentricRadius) * Math.sin(angle)})`;
      });

    svgElement.selectAll('.support-circle')
      .transition()
      .duration(duration)
      .attr('r', supportCircleRadius)
      .attr('cx', (_, i) => supportCircleOrbitRadius * Math.cos((i - 1) * (2 * Math.PI / 3)))
      .attr('cy', (_, i) => supportCircleOrbitRadius * Math.sin((i - 1) * (2 * Math.PI / 3)));

    svgElement.selectAll('.purchased-circle-group')
      .transition()
      .duration(duration)
      .attr('transform', function(d: any) {
        const angle = d.angle;
        return `translate(${(purchasedConcentricRadius - diseaseConcentricRadius) * Math.cos(angle)}, ${(purchasedConcentricRadius - diseaseConcentricRadius) * Math.sin(angle)})`;
      });

    svgElement.selectAll('.purchased-circle')
      .transition()
      .duration(duration)
      .attr('r', purchasedCircleRadius);

    svgElement.selectAll('.approved-drug-group')
      .transition()
      .duration(duration)
      .attr('transform', function(d: any) {
        const angle = d.angle;
        return `translate(${(approvedDrugConcentricRadius - diseaseConcentricRadius) * Math.cos(angle)}, ${(approvedDrugConcentricRadius - diseaseConcentricRadius) * Math.sin(angle)})`;
      });

    svgElement.selectAll('.approved-drug')
      .transition()
      .duration(duration)
      .attr('transform', 'scale(1)');

    backgroundGroup.selectAll('circle')
      .transition()
      .duration(duration)
      .attr('r', (_, i) => initialBackgroundRadii[i])
      .attr('opacity', 1);

    centralText?.transition()
      .attr('opacity', 1);

    svgElement.selectAll('.ta-circles')
      .transition()
      .duration(duration)
      .attr('opacity', 1);

    selectedItem = null;
    isDrawerOpen = false;
  }

  function closeDrawer() {
    resetVisualization();
  }

  function updateSidebar(item: DataItem | null = null) {
    const event = new CustomEvent('sidebarUpdate', {
      detail: item,
    });
    window.dispatchEvent(event);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && selectedItem) {
      resetVisualization();
    }
  }

  function wrapText(text: d3.Selection<SVGTextElement, { id: string; angle: number; radius: number; }, null, undefined>, width: number) {
  const words = text.text().split(/\s+/).reverse();
  let word: string | undefined;
  let line: string[] = [];
  let lineNumber = 0;
  const lineHeight = 1.1;
  const y = text.attr('y');
  const dy = parseFloat(text.attr('dy') || '0');
  let tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
  
  while (word = words.pop()) {
    line.push(word);
    tspan.text(line.join(' '));
    if ((tspan.node()?.getComputedTextLength() ?? 0) > width) {
      line.pop();
      tspan.text(line.join(' '));
      line = [word];
      tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', `${++lineNumber * lineHeight + dy}em`).text(word);
    }
  }
}

onMount(() => {
    updateVisualization();
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="visualization-container">
  <div class="visualization-wrapper">
    <svg bind:this={svg} {width} {height}></svg>
  </div>
</div>

<style>
  .visualization-container {
    position: relative;
  }
</style>