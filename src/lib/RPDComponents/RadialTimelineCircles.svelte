<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate } from 'svelte';
    import * as d3 from 'd3';
    import { Button, NumberInput } from "carbon-components-svelte";
    import SimpleDrawer from './RPDDrawer.svelte';
    import "carbon-components-svelte/css/all.css";
    
    export let width: number;
    export let data: Array<{ Year: string, RPD: string, "RPD PRV ": string }>;
    export let constellationData: Array<any>;
    
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    let currentYear: string;
    let container: HTMLElement;
    let scrollPosition = 0;
    
    let isDrawerOpen = false;
    let selectedData: { Year: string, "RPD PRV ": string, TherapeuticArea: string } | null = null;
    
    const dispatch = createEventDispatcher();
    const margin = { top: 25, right: 150, bottom: 100, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    let innerHeight: number;
    let yearWidth = 135;
    const initialCircleRadius = 10;
    const finalCircleRadius = 25;
    const minLineHeight = 50;
    const lineHeightIncrement = 50;
    const minCurveStrength = 0.2;
    const curveStrengthIncrement = 0.0;
    const maxCurveStrength = 0.0;
    const tAThresholdForDoubleCurve = 9;
    const defaultLineColor = "#43887F";
    let lineAnimationDuration = 200;
    const circleAnimationDuration = 250;
    const circleAnimationDelay = 150;
    
    let animationTimePerPixel = 2.5; // ms per pixel
    
    const therapeuticAreas = [
      'Neurology', 'Hematology', 'Immunology', 'Metabolic', 'Oncology',
      'Pulmonology', 'Ophthalmology', 'Dermatology', 'Orthopedics', 'Hepatology', 
      'Nephrology', 'Genetic', 'Endocrinology', 'Gastroenterology'
    ];
    
    const colorScale = d3.scaleOrdinal(d3.schemeDark2).domain(therapeuticAreas);
    
    // Add 2012 and 2013 to the years array
    const years = ['2012', '2013', ...constellationData.map(item => item.Year)];
    const minYear = Math.min(...years.map(Number));
    const maxYear = Math.max(...years.map(Number));
    
    const averageRPD = d3.mean(data.filter(d => +d.Year > 2013), d => +d.RPD);
    
    // Extend data to include 2012, 2013 and years without RPD data
    const extendedData = [
      { Year: '2013', "RPD PRV ": "0", RPD: "8" }, // Add 2013 data
      ...data.map(d => ({ Year: d.Year, "RPD PRV ": d["RPD PRV "], RPD: d.RPD })),
      ...years.filter(year => !data.find(d => d.Year === year)).map(year => ({ Year: year, "RPD PRV ": "0", RPD: averageRPD.toString() }))];
    
    $: xScale = d3.scaleLinear()
        .domain([minYear, maxYear + 1])
        .range([0, (maxYear - minYear + 1) * yearWidth]);
    
    $: yScale = d3.scaleLinear()
        .domain([0, d3.max(extendedData, d => +d.RPD) || 0])
        .range([innerHeight, 0]);
    
    $: processedData = processConstellationData(constellationData);
    
    function processConstellationData(data: any[]) {
        return data.reduce((acc, entry) => {
            const year = entry.Year;
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(entry);
            return acc;
        }, {});
    }
        function getLineHeight(count: number): number {
            return Math.max(minLineHeight, minLineHeight + (count - 1) * lineHeightIncrement);
        }
        
        function getCurveStrength(taCount: number): number {
            return Math.min(minCurveStrength + (taCount - 1) * curveStrengthIncrement, maxCurveStrength);
        }
        
        function getRadialRadius(count: number): number {
            if (count <= 3) return 20;
            if (count >= 7) return 35;
            return 25;
        }
        
        function getMostPrevalentTA(entries: any[]): string {
            const taCounts = entries.reduce((acc, entry) => {
                acc[entry.name] = (acc[entry.name] || 0) + 1;
                return acc;
            }, {});
        
            const maxCount = Math.max(...Object.values(taCounts));
            const mostPrevalentTAs = Object.keys(taCounts).filter(ta => taCounts[ta] === maxCount);
        
            return mostPrevalentTAs.length === 1 ? mostPrevalentTAs[0] : null;
        }
        
        function getLineColor(entries: any[]): string {
            const mostPrevalentTA = getMostPrevalentTA(entries);
            return mostPrevalentTA ? colorScale(mostPrevalentTA) : defaultLineColor;
        }
        
        function getStrokeColor(d: any): string {
            return d.Purchased === "Y" ? "#9B8843" : "#F0CE98";
        }
        
        onMount(() => {
            innerHeight = window.innerHeight * 0.7 - margin.top - margin.bottom;
            currentYear = minYear.toString();
            
            svg = d3.select('#radial-timeline')
                .attr('width', width)
                .attr('height', window.innerHeight * 0.7)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);
        
            tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0)
                .style('position', 'absolute')
                .style('background-color', 'white')
                .style('border', '1px solid #ddd')
                .style('padding', '10px')
                .style('border-radius', '5px')
                .style('pointer-events', 'none');
        
            drawTimeline();
            updateTimeline(true);
        });
        
        function drawTimeline() {
            if (!svg) return;
        
            const xAxis = d3.axisBottom(xScale)
                .tickValues(d3.range(minYear, maxYear + 2))
                .tickFormat(d => d > maxYear ? "Overview" : d3.format('d')(d));
        
            svg.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis)
                .selectAll('text')
                .style('text-anchor', 'middle');
        
            const yAxis = d3.axisLeft(yScale)
                .ticks(5);
        
            svg.append('g')
                .attr('class', 'y-axis')
                .call(yAxis);
        
            // Add dotted lines extending from y-axis tick marks
            svg.selectAll('.y-axis-grid')
                .data(yScale.ticks(5))
                .enter()
                .append('line')
                .attr('class', 'y-axis-grid')
                .attr('x1', 0)
                .attr('x2', innerWidth)
                .attr('y1', d => yScale(d))
                .attr('y2', d => yScale(d))
                .attr('stroke', '#ccc')
                .attr('stroke-dasharray', '2,2');
        
            svg.append('text')
                .attr('class', 'y-axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('y', 0 - margin.left)
                .attr('x', 0 - (innerHeight / 2))
                .attr('dy', '1em')
                .attr('font-size', '10px')
                .attr('font-family', 'IBM Plex Mono')
                .attr('font-weight', '800')
                .style('text-anchor', 'right')
                .text('RPD Designations');
        
            svg.append('line')
                .attr('class', 'vertical-line')
                .attr('stroke', '#DE4726')
                .attr('stroke-dasharray', '2,5,2,5')
                .attr('stroke-width', .5);
        
            svg.append('text')
                .attr('class', 'year-text')
                .attr('fill', '#333')
                .attr('font-size', '10px')
                .attr('font-weight', 'bold');
        
            // Create a group for the bars to ensure they're always on top
            svg.append('g')
                .attr('class', 'bar-group');
        }
        
        
    function updateTimeline(isInitialRender: boolean) {
        if (!svg) return;
    
        const t = svg.transition().duration(750) as any;
    
        svg.selectAll('circle').interrupt();
        svg.selectAll('path').interrupt();
    
        yearWidth = currentYear === "overview" ? 100 : 200;
    
        xScale.domain([minYear, maxYear + 1])
              .range([0, (maxYear - minYear + 1) * yearWidth]);
    
        yScale.domain([0, 300 || 0])
              .range([innerHeight, 0]);
    
        // Update RPD bars
        svg.select('.bar-group')
            .selectAll('.rpd-bar')
            .data(extendedData.filter(d => d.Year !== "overview"))
            .join(
                enter => enter.append('rect')
                    .attr('class', 'rpd-bar')
                    .attr('x', d => xScale(+d.Year) - yearWidth / 4)
                    .attr('width', yearWidth / 10)
                    .attr('y', innerHeight)
                    .attr('height', 0)
                    .attr('fill', d => (+d.RPD === averageRPD && +d.Year > 2012) ? 'none' : '#43887F')
                    .attr('stroke', d => (+d.RPD === averageRPD && +d.Year > 2012) ? '#43887F' : 'none')
                    .attr('stroke-dasharray', d => (+d.RPD === averageRPD && +d.Year > 2012) ? '5,5' : 'none'),
                update => update,
                exit => exit.remove()
            )
            .on('mouseover', handleBarMouseOver)
            .on('mouseout', handleBarMouseOut)
            .transition(t)
            .attr('x', d => xScale(+d.Year) - yearWidth / 4)
            .attr('width', yearWidth / 2)
            .attr('y', d => +d.Year <= +currentYear ? yScale(+d.RPD) : innerHeight)
            .attr('height', d => +d.Year <= +currentYear || currentYear === "overview" ? innerHeight - yScale(+d.RPD) : 0)
            .attr('opacity', 0.7);
        
            Object.entries(processedData).forEach(([year, entries]) => {
                const lineHeight = getLineHeight(entries.length);
                const radialRadius = getRadialRadius(entries.length);
                const yearCenter = { x: xScale(+year), y: yScale(0) - lineHeight - radialRadius };
                const angleStep = (2 * Math.PI) / entries.length;
        
                const distinctTAs = new Set(entries.map(entry => entry.name)).size;
                const curveStrength = getCurveStrength(distinctTAs);
        
                let curvePoints;
                if (distinctTAs >= tAThresholdForDoubleCurve) {
                    curvePoints = [
                        [yearCenter.x, yScale(0)],
                        [yearCenter.x + lineHeight * 0.2, yearCenter.y + radialRadius + lineHeight * 0.5],
                        [yearCenter.x - lineHeight * 0.2, yearCenter.y + radialRadius + lineHeight * 0.3],
                        [yearCenter.x, yearCenter.y]
                    ];
                } else {
                    curvePoints = [
                        [yearCenter.x, yScale(0)],
                        [yearCenter.x + lineHeight * curveStrength, yearCenter.y + radialRadius + lineHeight / 2],
                        [yearCenter.x, yearCenter.y]
                    ];
                }
        
                const curve = d3.line().curve(d3.curveBasis)(curvePoints);
                const lineColor = getLineColor(entries);
        
                const linePath = svg.selectAll(`.curve-${year}`)
                    .data([null])
                    .join(
                        enter => enter.append('path')
                            .attr('class', `curve-${year}`)
                            .attr('d', curve)
                            .attr('fill', 'none')
                            .attr('stroke', lineColor)
                            .attr('stroke-width', 1)
                            .style('opacity', 0),
                        update => update,
                        exit => exit.remove()
                    );
        
                if (+year === +currentYear) {
                    const totalLength = linePath.node().getTotalLength();
                    lineAnimationDuration = totalLength * animationTimePerPixel;
                    linePath
                        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
                        .attr('stroke-dashoffset', totalLength)
                        .transition()
                        .duration(lineAnimationDuration)
                        .attr('stroke-dashoffset', 0)
                        .style('opacity', 1)
                        .on('end', () => {
                            animateCircles(year, entries, yearCenter, angleStep, radialRadius);
                        });
                } else if (+year <= +currentYear || currentYear === "overview") {
                    linePath
                        .attr('stroke-dasharray', null)
                        .attr('stroke-dashoffset', null)
                        .style('opacity', 1);
                    updateCircles(year, entries, yearCenter, angleStep, 1, radialRadius, true, true);
                } else {
                    linePath.style('opacity', 0.05);
                    updateCircles(year, entries, yearCenter, angleStep, 0, radialRadius, false, false);
                }
            });
        
            // Update axes
            svg.select('.x-axis')
                .transition(t)
                .attr('transform', `translate(0,${innerHeight})`)
                .call(d3.axisBottom(xScale)
                    .tickValues(d3.range(minYear, maxYear + 2))
                    .tickFormat(d => d > maxYear ? "Overview" : d3.format('d')(d)));
        
            svg.select('.y-axis')
                .transition(t)
                .call(d3.axisLeft(yScale).ticks(5));
        
            svg.selectAll('.y-axis-grid')
                .data(yScale.ticks(5))
                .join(
                    enter => enter.append('line')
                        .attr('class', 'y-axis-grid')
                        .attr('x1', 0)
                        .attr('x2', innerWidth)
                        .attr('stroke', '#ccc')
                        .attr('stroke-dasharray', '2,2'),
                    update => update,
                    exit => exit.remove()
                )
                .transition(t)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d));
    
        svg.select('.vertical-line')
            .transition(t)
            .attr('x1', xScale(currentYear === "overview" ? maxYear : +currentYear))
            .attr('x2', xScale(currentYear === "overview" ? maxYear : +currentYear))
            .attr('y1', 0)
            .attr('y2', innerHeight);
    
        svg.select('.year-text')
            .transition(t)
            .attr('x', xScale(currentYear === "overview" ? maxYear : +currentYear))
            .attr('y', -10)
            .text(currentYear === "overview" ? "Overview" : currentYear);
    }
    
    function animateCircles(year: string, entries: any[], yearCenter: {x: number, y: number}, angleStep: number, radialRadius: number) {
        entries.sort((a, b) => new Date(`${a.Year}-${a.Month}-${a.Date}`).getTime() - new Date(`${b.Year}-${b.Month}-${b.Date}`).getTime());
    
        svg.selectAll(`.circle-${year}`)
            .data(entries)
            .join(
                enter => enter.append('circle')
                    .attr('class', `circle-${year}`)
                    .attr('cx', (d, i) => yearCenter.x + radialRadius * Math.cos(i * angleStep - Math.PI / 2))
                    .attr('cy', (d, i) => yearCenter.y + radialRadius * Math.sin(i * angleStep - Math.PI / 2))
                    .attr('r', initialCircleRadius)
                    .attr('fill', 'none')
                    .attr('stroke', d => getStrokeColor(d))
                    .attr('stroke-width', 4)
                    .style('opacity', 0),
                update => update,
                exit => exit.remove()
            )
            .transition()
            .delay((d, i) => i * circleAnimationDelay)
            .duration(circleAnimationDuration)
            .attr('r', finalCircleRadius)
            .style('opacity', 1)
            .on('end', (d, i) => {
                if (i === entries.length - 1) {
                    animateCircleFills(year, entries);
                }
            });
    }
    
    function animateCircleFills(year: string, entries: any[]) {
        svg.selectAll(`.circle-${year}`)
            .style('fill', d => colorScale(d.name))
            .style('fill-opacity', 0)
            .transition()
            .delay((d, i) => i * circleAnimationDelay)
            .duration(circleAnimationDuration)
            .style('fill-opacity', 1)
            .selection()
            .on('mouseover', handleCircleMouseOver)
            .on('mouseout', handleCircleMouseOut)
            .on('click', handleCircleClick);
    }
    
    function updateCircles(year: string, entries: any[], yearCenter: {x: number, y: number}, angleStep: number, opacity: number, radialRadius: number, showFill: boolean, immediate: boolean) {
        const circleSelection = svg.selectAll(`.circle-${year}`)
            .data(entries)
            .join(
                enter => enter.append('circle')
                    .attr('class', `circle-${year}`)
                    .attr('cx', (d, i) => yearCenter.x + radialRadius * Math.cos(i * angleStep - Math.PI / 2))
                    .attr('cy', (d, i) => yearCenter.y + radialRadius * Math.sin(i * angleStep - Math.PI / 2))
                    .attr('r', immediate ? finalCircleRadius : initialCircleRadius)
                    .attr('fill', showFill ? d => colorScale(d.name) : 'none')
                    .attr('stroke', d => getStrokeColor(d))
                    .attr('stroke-width', 1)
                    .style('opacity', immediate ? opacity : 0),
                update => update
                    .attr('cx', (d, i) => yearCenter.x + radialRadius * Math.cos(i * angleStep - Math.PI / 2))
                    .attr('cy', (d, i) => yearCenter.y + radialRadius * Math.sin(i * angleStep - Math.PI / 2)),
                exit => exit.remove()
            );
    
        if (immediate) {
            circleSelection
                .attr('r', finalCircleRadius)
                .attr('fill', showFill ? d => colorScale(d.name) : 'none')
                .style('opacity', opacity)
                .style('fill-opacity', showFill ? opacity : 0);
        } else {
            circleSelection
                .transition()
                .duration(circleAnimationDuration)
                .attr('r', finalCircleRadius)
                .attr('fill', showFill ? d => colorScale(d.name) : 'none')
                .style('opacity', opacity)
                .style('fill-opacity', showFill ? opacity : 0);
        }
    
        circleSelection
            .on('mouseover', handleCircleMouseOver)
            .on('mouseout', handleCircleMouseOut)
            .on('click', handleCircleClick);
    }
    
    function handleCircleMouseOver(event: MouseEvent, d: any) {
        const target = event.target as SVGCircleElement;
        
        svg.selectAll('circle')
            .transition()
            .duration(200)
            .style('opacity', 0.1);
        
        d3.select(target)
            .transition()
            .duration(200)
            .style('opacity', 1)
            .attr('stroke-width', 3)
            .attr('fill', d => colorScale(d.name));
    
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        
        tooltip.html(`
            <strong>${d.Month} ${d.Date} ${d.Year}</strong><br/>
            ${d.id}<br/>
            ${d.name}<br/>
            ${d.Sponsor}, ${d["Drug Name"]}<br/>
            ${d["Treatment Type"] || "NA"}<br/>
            Purchased: ${d.Purchased}
        `)
        .style('left', (event.pageX + 50) + 'px')
        .style('top', (event.pageY - 100) + 'px');
    }
    
    function handleCircleMouseOut() {
        svg.selectAll('circle')
            .transition()
            .duration(200)
            .style('opacity', (d: any) => {
                if (d.Year === currentYear) return 0.95;
                if (+d.Year <= +currentYear || currentYear === "overview") return 1;
                return 0;
            })
            .attr('stroke-width', 1)
            .attr('fill', (d: any) => {
                if (d.Year === currentYear || +d.Year <= +currentYear || currentYear === "overview") {
                    return colorScale(d.name);
                }
                return 'none';
            });
    
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }    
    
    function handleCircleClick(event: MouseEvent, d: any) {
        selectedData = d;
        isDrawerOpen = true;
    }
    
    function handleBarMouseOver(event: MouseEvent, d: any) {
        const target = event.target as SVGRectElement;
        
        d3.select(target)
            .transition()
            .duration(200)
            .attr('opacity', 1);
    
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        
        tooltip.html(`
            <strong>Year: ${d.Year}</strong><br/>
            RPD Value: ${d.RPD}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    }
    
    function handleBarMouseOut(event: MouseEvent, d: any) {
        const target = event.target as SVGRectElement;
        
        d3.select(target)
            .transition()
            .duration(200)
            .attr('opacity', 0.7);
    
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }
    
    function navigateYear(direction: 'prev' | 'next') {
        const years = [minYear.toString(), ...d3.range(minYear + 1, maxYear + 1).map(String), "overview"];
        const currentIndex = years.indexOf(currentYear);
        if (direction === 'prev' && currentIndex > 0) {
            currentYear = years[currentIndex - 1];
        } else if (direction === 'next' && currentIndex < years.length - 1) {
            currentYear = years[currentIndex + 1];
        }
        updateTimeline(false);
        centerCurrentYear();
        dispatch('yearChange', { year: currentYear });
    }
    
    function centerCurrentYear() {
        if (container && typeof window !== 'undefined') {
            const currentYearX = xScale(currentYear === "overview" ? maxYear : +currentYear);
            const containerWidth = container.clientWidth;
            scrollPosition = Math.max(0, currentYearX - containerWidth / 4);
            container.scrollLeft = scrollPosition;
        }
    }
    
    function closeDrawer() {
        isDrawerOpen = false;
    }
    </script>
    
    <div id="timeline-container" bind:this={container} style="height: 70vh;">
        <svg id="radial-timeline"></svg>
    </div>
    
    <div class="controls">
        <div class="navigation">
            <Button on:click={() => navigateYear('prev')} disabled={currentYear === minYear.toString()}>Previous Year</Button>
            <Button on:click={() => navigateYear('next')} disabled={currentYear === "overview"}>Next Year</Button>
        </div>
    </div>
    
    {#if isDrawerOpen && selectedData}
        <SimpleDrawer bind:isOpen={isDrawerOpen} data={selectedData} onClose={closeDrawer} />
    {/if}
    
    <style>
        #timeline-container {
            width: 100%;
            overflow-x: auto;
            align-content: bottom;
            position: relative;
        }
    
        .navigation {
            display: flex;
            justify-content: space-between;
            margin-left: 50px;
            margin-right: 50px;
        }
    
        :global(.tooltip) {
            position: absolute;
            text-align: left;
            padding: 8px;
            font: 12px sans-serif;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            pointer-events: none;
        }
    
        :global(.x-axis text) {
            text-anchor: middle;
        }
    
        :global(.x-axis line, .x-axis path) {
            stroke: #ddd;
        }
    
        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    
        :global(.y-axis-grid) {
            stroke: #ccc;
            stroke-dasharray: 2,2;
        }
    </style>