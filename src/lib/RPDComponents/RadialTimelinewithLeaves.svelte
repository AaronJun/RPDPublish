<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate } from 'svelte';
    import * as d3 from 'd3';
    import { Button } from "carbon-components-svelte";
    import SimpleDrawer from './RPDDrawer.svelte';
    import "carbon-components-svelte/css/all.css";
    
    export let width: number;
    export let data: Array<{ Year: string, "RPD PRV ": string }>;
    export let constellationData: Array<any>;
    
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    let currentYear = data[0].Year;
    let container: HTMLElement;
    let scrollPosition = 0;
    
    let isDrawerOpen = false;
    let selectedData: { Year: string, "RPD PRV ": string, TherapeuticArea: string } | null = null;
    
    const dispatch = createEventDispatcher();
    const margin = { top: 50, right: 150, bottom: 100, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    let innerHeight: number;
    const yearWidth = 250;
    const circleRadius = 25;
    const minLineHeight = 50;
    const lineHeightIncrement = 50;
    const minCurveStrength = 0.05;
    const curveStrengthIncrement = 0.05;
    const maxCurveStrength = 0.3;
    const tAThresholdForDoubleCurve = 5;
    const defaultLineColor = "#161616";
    const lineAnimationDuration = 850;
    const circleAnimationDuration = 400;
    const circleAnimationDelay = 100;
    
    // New constants for ovals
    const ovalHeight = 10;
    const ovalWidth = 25;
    const ovalStartY = 10;
    const ovalSpacing = 10;
    
    const therapeuticAreas = [
      'Neurology', 'Hematology', 'Immunology', 'Metabolic', 'Oncology',
      'Pulmonology', 'Ophthalmology', 'Dermatology', 'Orthopedics', 'Hepatology', 
      'Nephrology', 'Genetic', 'Endocrinology', 'Gastroenterology'
    ];
    
    const colorScale = d3.scaleOrdinal(d3.schemePastel2).domain(therapeuticAreas);
    
    $: xScale = d3.scaleLinear()
        .domain([d3.min(data, d => +d.Year) || 0, d3.max(data, d => +d.Year) || 0])
        .range([0, (data.length - 1) * yearWidth]);
    
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
        if (count <= 3) return 15;
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
        return d.Purchased === "Y" ? "#9B8843" : "#6F70BB";
    }
    
    onMount(() => {
        innerHeight = window.innerHeight * 0.45 - margin.top - margin.bottom;
        
        svg = d3.select('#radial-timeline')
            .attr('width', width)
            .attr('height', window.innerHeight * 0.45)
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
    
    afterUpdate(() => {
        if (typeof window !== 'undefined') {
            updateTimeline(false);
            centerCurrentYear();
        }
    });
    
    function drawTimeline() {
        if (!svg) return;
    
        const xAxis = d3.axisBottom(xScale)
            .tickValues(data.map(d => +d.Year))
            .tickFormat(d3.format('d'));
    
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .style('text-anchor', 'middle');
    
        svg.append('line')
            .attr('class', 'vertical-line')
            .attr('stroke', '#DE4726')
            .attr('stroke-dasharray', '2,5,2,5')
            .attr('stroke-width', 1);
    
        svg.append('text')
            .attr('class', 'year-text')
            .attr('fill', '#333')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold');
    }

    function updateTimeline(isInitialRender: boolean) {
        if (!svg) return;

        const t = svg.transition().duration(750);

        Object.entries(processedData).forEach(([year, entries]) => {
            const lineHeight = getLineHeight(entries.length);
            const radialRadius = getRadialRadius(entries.length);
            const yearCenter = { x: xScale(+year), y: innerHeight - lineHeight - radialRadius };
            const angleStep = (2 * Math.PI) / entries.length;

            const distinctTAs = new Set(entries.map(entry => entry.name)).size;
            const curveStrength = getCurveStrength(distinctTAs);

            let curvePoints;
            if (distinctTAs >= tAThresholdForDoubleCurve) {
                curvePoints = [
                    [yearCenter.x, innerHeight],
                    [yearCenter.x + lineHeight * 0.2, yearCenter.y + radialRadius + lineHeight * 0.5],
                    [yearCenter.x - lineHeight * 0.2, yearCenter.y + radialRadius + lineHeight * 0.3],
                    [yearCenter.x, yearCenter.y]
                ];
            } else {
                curvePoints = [
                    [yearCenter.x, innerHeight],
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
                linePath
                    .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
                    .attr('stroke-dashoffset', totalLength)
                    .transition()
                    .duration(lineAnimationDuration)
                    .attr('stroke-dashoffset', 0)
                    .style('opacity', 1)
                    .on('end', () => {
                        animateCircles(year, entries, yearCenter, angleStep, radialRadius);
                        drawOvals(year, entries, yearCenter.x);
                    });
            } else if (+year < +currentYear) {
                linePath
                    .attr('stroke-dasharray', null)
                    .attr('stroke-dashoffset', null)
                    .style('opacity', 0.1);
                updateCircles(year, entries, yearCenter, angleStep, 0.2, radialRadius);
                drawOvals(year, entries, yearCenter.x, 0.2);
            } else {
                linePath.style('opacity', 0.1);
                updateCircles(year, entries, yearCenter, angleStep, 0.2, radialRadius);
                drawOvals(year, entries, yearCenter.x, 0.2);
            }
        });

        svg.select('.vertical-line')
            .transition(t)
            .attr('x1', xScale(+currentYear))
            .attr('x2', xScale(+currentYear))
            .attr('y1', 0)
            .attr('y2', innerHeight);

        svg.select('.year-text')
            .transition(t)
            .attr('x', xScale(+currentYear))
            .attr('y', -10)
            .text(currentYear);
    }

    function drawOvals(year, entries, centerX, opacity = 1) {
        const uniqueIds = new Set(entries.map(entry => entry.id));
        const ovals = Array.from(uniqueIds).map((id, index) => ({
            id,
            x: centerX + (index % 2 === 0 ? -ovalWidth - 5 : 5),
            y: innerHeight - ovalStartY - index * (ovalHeight + ovalSpacing),
            side: index % 2 === 0 ? 'left' : 'right'
        }));

        svg.selectAll(`.oval-${year}`)
            .data(ovals)
            .join(
                enter => enter.append('ellipse')
                    .attr('class', `oval-${year}`)
                    .attr('cx', d => d.x + ovalWidth / 2)
                    .attr('cy', d => d.y + ovalHeight / 2)
                    .attr('rx', ovalWidth / 2)
                    .attr('ry', ovalHeight / 2)
                    .attr('fill', 'white')
                    .attr('stroke', defaultLineColor)
                    .attr('stroke-width', 1)
                    .style('opacity', 0),
                update => update,
                exit => exit.remove()
            )
            .transition()
            .duration(circleAnimationDuration)
            .style('opacity', opacity);
    }

    function animateCircles(year, entries, yearCenter, angleStep, radialRadius) {
        entries.sort((a, b) => new Date(`${a.Year}-${a.Month}-${a.Date}`) - new Date(`${b.Year}-${b.Month}-${b.Date}`));

        svg.selectAll(`.circle-${year}`)
            .data(entries)
            .join(
                enter => enter.append('circle')
                    .attr('class', `circle-${year}`)
                    .attr('cx', (d, i) => yearCenter.x + radialRadius * Math.cos(i * angleStep - Math.PI / 2))
                    .attr('cy', (d, i) => yearCenter.y + radialRadius * Math.sin(i * angleStep - Math.PI / 2))
                    .attr('r', 0)
                    .attr('fill', d => colorScale(d.name))
                    .attr('stroke', d => getStrokeColor(d))
                    .attr('stroke-width', 1)
                    .style('opacity', 0),
                update => update,
                exit => exit.remove()
            )
            .transition()
            .delay((d, i) => i * circleAnimationDelay)
            .duration(circleAnimationDuration)
            .attr('r', circleRadius)
            .style('opacity', 0.92)
            .selection()
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOut)
            .on('click', handleCircleClick);
    }

    function updateCircles(year, entries, yearCenter, angleStep, opacity, radialRadius) {
        svg.selectAll(`.circle-${year}`)
            .data(entries)
            .join(
                enter => enter.append('circle')
                    .attr('class', `circle-${year}`)
                    .attr('cx', (d, i) => yearCenter.x + radialRadius * Math.cos(i * angleStep - Math.PI / 2))
                    .attr('cy', (d, i) => yearCenter.y + radialRadius * Math.sin(i * angleStep - Math.PI / 2))
                    .attr('r', circleRadius)
                    .attr('fill', d => colorScale(d.name))
                    .attr('stroke', d => getStrokeColor(d))
                    .attr('stroke-width', 1)
                    .style('opacity', opacity),
                update => update
                    .attr('cx', (d, i) => yearCenter.x + radialRadius * Math.cos(i * angleStep - Math.PI / 2))
                    .attr('cy', (d, i) => yearCenter.y + radialRadius * Math.sin(i * angleStep - Math.PI / 2))
                    .attr('stroke', d => getStrokeColor(d))
                    .style('opacity', opacity),
                exit => exit.remove()
                )
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOut)
            .on('click', handleCircleClick);
    }

    function handleMouseOver(event: MouseEvent, d: any) {
        const target = event.target as SVGCircleElement;
        
        // Dim all circles except the hovered one
        svg.selectAll('circle')
            .transition()
            .duration(200)
            .style('opacity', 0.2);
        
        // Highlight the hovered circle
        d3.select(target)
            .transition()
            .duration(200)
            .style('opacity', 1)
            .attr('stroke-width', 3);

        // Show tooltip
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        
        tooltip.html(`
            <strong>${d.Year}, ${d.Month}, ${d.Date}</strong><br/>
            ${d.id}<br/>
            ${d.name}<br/>
            ${d.Sponsor}, ${d["Drug Name"]}<br/>
            ${d["Treatment Type"] || "NA"}<br/>
            Purchased: ${d.Purchased}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    }

    function handleMouseOut() {
        // Reset circles to their original opacity and stroke width
        svg.selectAll('circle')
            .transition()
            .duration(200)
            .style('opacity', (d: any) => d.Year === currentYear ? 0.9 : 0.2)
            .attr('stroke-width', 1);

        // Hide tooltip
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }    
    
    function handleCircleClick(event: MouseEvent, d: any) {
        selectedData = d;
        isDrawerOpen = true;
    }
    
    function navigateYear(direction: 'prev' | 'next') {
        const currentIndex = data.findIndex(d => d.Year === currentYear);
        if (direction === 'prev' && currentIndex > 0) {
            currentYear = data[currentIndex - 1].Year;
        } else if (direction === 'next' && currentIndex < data.length - 1) {
            currentYear = data[currentIndex + 1].Year;
        }
        updateTimeline(false);
        centerCurrentYear();
        dispatch('yearChange', { year: currentYear });
    }

    function centerCurrentYear() {
        if (container && typeof window !== 'undefined') {
            const currentYearX = xScale(+currentYear);
            const containerWidth = container.clientWidth;
            scrollPosition = Math.max(0, currentYearX - containerWidth / 2);
            container.scrollLeft = scrollPosition;
        }
    }

    function closeDrawer() {
        isDrawerOpen = false;
    }
</script>

<div id="timeline-container" bind:this={container} style="height: 45vh;">
    <svg id="radial-timeline"></svg>
</div>
<div class="controls">
    <div class="navigation">
        <Button on:click={() => navigateYear('prev')} disabled={currentYear === data[0].Year}>Previous Year</Button>
        <Button on:click={() => navigateYear('next')} disabled={currentYear === data[data.length - 1].Year}>Next Year</Button>
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
        margin-top: 10px;
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
        margin: 20px 0;
    }
</style>