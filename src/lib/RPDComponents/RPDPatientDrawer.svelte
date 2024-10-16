<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import familyImage from './Family.png';
  import {Button} from "carbon-components-svelte";
  import {ArrowRight} from "carbon-icons-svelte";

  export let isOpen: boolean = false;
  export let onClose: () => void;
  export let data: { Year: string, RPD: string, "RPD PRV ": string };

  const TRANSITION_DURATION = 300;
  const FADE_DURATION = 200;

  function handleBackdropClick(event: MouseEvent) {
      if (event.target === event.currentTarget) {
          onClose();
      }
  }

  function handleCloseClick() {
      onClose();
  }

  function handleImageError() {
      // Handle image loading error if needed
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="drawer-backdrop"
       on:click={handleBackdropClick}
       transition:fade={{duration: FADE_DURATION}}>
      <div class="drawer"
           in:fly={{duration: TRANSITION_DURATION, x: 650, opacity: 1, easing: cubicOut}}
           out:fly={{duration: TRANSITION_DURATION, x: 400, opacity: 0, easing: cubicOut}}>
          <button class="close-button" on:click={handleCloseClick}>&times;</button>
          <div class="drawer-content">
              <h2>Community Quote</h2>
              <img src={familyImage} alt="Family" class="image" on:error={handleImageError} />
              <p class="lede">
                “Dakota makes my life so much better seeing his positive outlook and upbeat personality—he’s a blessing for so many other families and ours.” 
                </p>
            <p>
                “If Dakota can do so well with early treatment then I can only hope that all of the new babies with infantile- and late-onset Pompe can do as great and even better than Dakota. Dakota makes my life so much better seeing his positive outlook and upbeat personality—he’s a blessing for so many other families and ours.”      
            </p>
          </div>
          <Button icon={ArrowRight}>Read more community insights</Button>
      </div>
    </div>
{/if}


<style>
h2 {
    cursor: pointer;
  }

  h2:hover {
    text-decoration: underline;
  }
  .image {
    width: 55%;
    height: auto;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .lede {
    font-size: 1.25rem;
    font-weight: 800;
    color: #5667AE;
    margin-bottom: 1rem;
  }

  .drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
  }

  .drawer {
    position: relative;
    width: 55vw;
    height: 100%;
    background-color: white;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    overflow-y: auto;
    border-left: 5px solid;
    padding: 2rem;
    box-sizing: border-box;
  }

  .drawer-content {
    padding: 3rem 2rem 5rem 1rem;
  }

  .drawer-header {
    margin-bottom: 2rem;
  }

  .close-button {
    position: absolute;
    top: rem;
    right: 1rem;
    font-size: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
  }

  h2 {
    font-size: .85rem;
    font-weight: 500;
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  .study-id {
    font-size: .75rem;
    font-weight: 800;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .study-info {
    font-size: 1rem;
    color: #161616;
    margin-bottom: 0.5rem;
  }

  .therapeutic-area {
    font-size: 1rem;
    font-weight: 600;
    color: #333;
  }

  .stats-container {
    display: flex;
    margin-bottom: 2rem;
  }

  .stat-item {
    text-align: left;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    margin-bottom: .25rem;
    font-weight: bold;
    color: #333;
  }

  .stat-label {
    font-size: 1rem;
    color: #666;
  }

  .indication-section {
    margin-bottom: 5rem;
    align-items: left;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 800;
  
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .related-studies-list {
    list-style-type: none;
    padding: 0;
  }

  .related-studies-list li {
    margin-bottom: 0.5rem;
  }

  .related-studies-list a {
    color: #5667AE;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .related-studies-list a:hover {
    color: #E94E2F;
    text-decoration: underline;
  }

  .map-container {
    width: 100%;
  }

  .show-more {
    margin-top: 1rem;
    text-align: left;
  }

  .related-studies-list {
    max-height: 300px;
    overflow-y: auto;
  }
  .visualization-container {
    margin-top: 20px;
    width: 100%;
    overflow-x: auto;
    display: flex;
    margin-bottom: 10rem;
    flex-direction: column;
    justify-content: space-evenly;
  }

</style>