<script lang="ts">
	import {Header, HeaderNav, HeaderNavItem,
		SideNav, SideNavDivider, SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem, 
		Content, Grid, Column, Row
		} from 'carbon-components-svelte';
	import "carbon-components-svelte/css/all.css";
	let isSideNavOpen = false;
</script>

	<Header 
	persistentHamburgerMenu={false}
	company="Patiently" platformName="IQ" bind:isSideNavOpen>
	
	<HeaderNav>
		<HeaderNavItem href="/timeline">Timeline</HeaderNavItem>
	</HeaderNav>
</Header>




<Content>
	<slot />
</Content>


<style>
	:global(body) {
		background-color: #ffffff;
	}
</style>