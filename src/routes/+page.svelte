<script lang="ts">
    // @ts-ignore
    import {Content, Grid, Row, Column} from 'carbon-components-svelte';
    import Cards from './layoutComponents/Cards.svelte';
    import DropdownFilters from './components/DropdownFilters.svelte';
    // @ts-ignore
    import SummaryTiles from './NewComponents/SummaryTiles.svelte';
    import InterestIndexWrapper from './NewComponents/InterestIndexWrapper.svelte';
    import SentimentRadialBarChart from './NewComponents/SentimentRadialBarChart.svelte';
    import AtlasViewMap from '$lib/AtlasComponents/AtlasViewMap.svelte';
    import data from './data/RadialChartData.json';

</script>


    <DropdownFilters />


    <SummaryTiles />
    

    
    <SentimentRadialBarChart {data}/>
    <Cards />
    <Content>
    <Grid>
            <Row>
                <div style="width: 100%; height: 1200px;">
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <iframe src="https://rhoinc.github.io/clinical-timelines/test-page/" width="100%" height="100%" style="border:none;" title="Clinical Timelines"></iframe>
                </div>
            </Row>
        </Grid>
        </Content>

