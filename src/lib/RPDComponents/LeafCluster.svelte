<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';

  export let entries: any[];
  export let yearCenter: { x: number; y: number };
  export let radialRadius: number;
  export let colorScale: d3.ScaleOrdinal<string, string>;
  export let handleMouseOver: (event: MouseEvent, d: any) => void;
  export let handleMouseOut: (event: MouseEvent) => void;
  export let handleClick: (event: MouseEvent, d: any) => void;
  export let visible: boolean = true;
  export let animate: boolean = false;

  let cluster: d3.Selection<SVGGElement, unknown, null, undefined>;

  onMount(() => {
    cluster = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'))
      .attr('class', 'cluster')
      .attr('transform', `translate(${yearCenter.x}, ${yearCenter.y})`);

    updateCluster();
  });

  afterUpdate(() => {
    updateCluster();
  });

  function updateCluster() {
    const angleStep = (2 * Math.PI) / entries.length;

    const elements = cluster.selectAll('.cluster-element')
      .data(entries)
      .join(
        enter => enter.append('g')
          .attr('class', 'cluster-element')
          .attr('opacity', 0)
      );

    elements.attr('transform', (d, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from the top
      const x = Math.cos(angle) * radialRadius;
      const y = Math.sin(angle) * radialRadius;
      return `translate(${x}, ${y}) rotate(${angle * 180 / Math.PI})`;
    });

    elements.selectAll('path')
      .data(d => [d])
      .join(
        enter => enter.append('path')
          .attr('d', 'M0 46C0 60.2066 5.58014 74.5619 17 87.5513C28.4199 74.5619 34 60.2066 34 46C34 31.7934 28.4199 17.4381 17 4.44874C5.58014 17.4381 0 31.7934 0 46Z')
          .attr('fill', d => colorScale(d.name))
          .attr('stroke', '#F4F4F4')
          .attr('stroke-width', 6)
      );

    // Add yellow circle in the center
    cluster.selectAll('circle')
      .data([null])
      .join(
        enter => enter.append('circle')
          .attr('r', 20)
          .attr('fill', '#F0CE98')
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
      );

    elements
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .on('click', handleClick);

    if (animate) {
      elements.transition()
        .duration(500)
        .delay((d, i) => i * 50)
        .attr('opacity', visible ? 1 : 0);
    } else {
      elements.attr('opacity', visible ? 1 : 0);
    }

    cluster.attr('opacity', visible ? 1 : 0);
  }
</script>

<svelte:element this={cluster?.node()} />