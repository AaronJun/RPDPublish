<script lang="ts">
    export let therapeuticAreaColors: Record<string, string>;
  
    // Sort the entries alphabetically by therapeutic area name
    $: sortedEntries = Object.entries(therapeuticAreaColors).sort((a, b) => a[0].localeCompare(b[0]));
  </script>
  
  <div class="legend-container">
    <h4>Therapeutic Areas</h4>
    <div class="legend-grid">
      {#each sortedEntries as [area, color]}
        <div class="legend-item">
          <span class="color-box" style="background-color: {color};"></span>
          <span class="area-name">{area}</span>
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .legend-container {
      margin-top: 1rem;
      border-radius: 4px;
    }
  
    h4 {
      font-size: 0.825rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #292F58;
    }
  
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      grid-template-rows: 5;
      gap: 0.5rem;
    }
  
    .legend-item {
      display: flex;
      align-items: center;
      font-size: 0.825rem;
    }
  
    .color-box {
      width: 10px;
      height: 10px;
      margin-right: 0.5rem;
      border: 1px solid #d8bd74;
    }
  

  </style>