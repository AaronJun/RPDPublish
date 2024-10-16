<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';
  
    export let data: any[];
    export let currentYear: string;
    export let width: number;
  
    const dispatch = createEventDispatcher();
    let svg: any;
    let progressBarElement: HTMLElement;
  
    $: timeScale = (date: Date) => {
      const start = new Date(data[0].Year, 0, 1);
      const end = new Date(data[data.length - 1].Year, 11, 31);
      return (date.getTime() - start.getTime()) / (end.getTime() - start.getTime()) * width;
    };
  
    $: progress = timeScale(new Date(currentYear, 11, 31)) / width * 100;
  
    onMount(() => {
      if (browser) {
        import('d3').then((d3) => {
          svg = d3.select(progressBarElement)
            .append('svg')
            .attr('width', width)
            .attr('height', 30);
  
          createProgressBar(d3);
        });
      }
    });
  
    function createProgressBar(d3: any) {
      svg.append('rect')
        .attr('class', 'progress-bar-bg')
        .attr('x', 0)
        .attr('y', 10)
        .attr('width', width)
        .attr('height', 8)
        .attr('fill', '#CACFE6');
  
      svg.append('rect')
        .attr('class', 'progress')
        .attr('x', 0)
        .attr('y', 10)
        .attr('height', 8)
        .attr('fill', '#DE4726');
  
      updateProgressBar();
      createEventCircles(d3);
    }
  
    function updateProgressBar() {
      if (svg) {
        svg.select('.progress')
          .transition()
          .duration(1000)
          .attr('width', `${progress}%`);
      }
    }
  
    function createEventCircles(d3: any) {
      svg.selectAll('.event-circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'event-circle')
        .attr('cx', d => timeScale(new Date(d.Year, d.Month === 'x' ? 0 : d3.timeParse("%B")(d.Month), d.Date === 'x' ? 1 : +d.Date)))
        .attr('cy', 14)
        .attr('r', 5)
        .attr('fill', '#4B0082')
        .on('click', (event: MouseEvent, d: any) => dispatch('eventClick', { event, data: d }));
    }
  
    $: {
      if (svg) {
        updateProgressBar();
      }
    }
  </script>
  
  <div bind:this={progressBarElement}></div>
  
  <style>
    .event-circle {
      cursor: pointer;
      transition: r 0.2s;
    }
    .event-circle:hover {
      r: 7;
    }
  </style>