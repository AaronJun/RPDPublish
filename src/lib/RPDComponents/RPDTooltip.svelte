<script>
  export let content = {
    drugName: '',
    sponsor: '',
    therapeuticArea: '',
    date: ''
  };
</script>

<div class="tooltip">
  <div class="tooltip-line drug-name">{content.drugName}</div>
  <div class="tooltip-line sponsor">{content.sponsor}</div>
  <div class="tooltip-line therapeutic-area">{content.therapeuticArea}</div>
  <div class="tooltip-line date">{content.date}</div>
</div>

<style>
  .tooltip {
    position: sticky;
    background-color: rgba(255, 255, 255, 0.8);
    color: rgb(66, 66, 66);
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
    max-width: 500px;
    z-index: 9999;
  }

  .tooltip-line {
    margin-bottom: 5px;
  }

  .drug-name {
    font-weight: bold;
    font-size: 16px;
  }

  .sponsor {
    font-style: italic;
  }

  .therapeutic-area {
    color: #ffd700; /* Example: gold color for therapeutic area */
  }

  .date {
    font-size: 12px;
    color: #cccccc;
  }
</style>