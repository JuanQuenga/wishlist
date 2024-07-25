<script>
  import Footer from '$lib/components/Footer.svelte';
  import Header from '$lib/components/Header.svelte';
  import '../../app.css';
</script>

<svelte:head>
  <title>Wishlist - Create & Share your wishes!</title>
</svelte:head>

<div class="leading-normal tracking-normal text-white gradient font-inter">
  <Header />
  <slot />
  <Footer />
</div>
