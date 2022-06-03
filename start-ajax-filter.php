<?php

/**
 * Plugin Name: Start Ajax Filter
 * Plugin URI: --
 * Description: Add simple filtering capabilities to the site
 * Author: Start Digital
 * Author URI: https://startdigital.com.au/
 * Version: 1.0
 * Text Domain: start-ajax-filter
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

define('START_AJAX_FILTER_ROOT_DIR_PATH', plugin_dir_path(__FILE__));
define('START_AJAX_FILTER_PLUGIN_PATH', plugins_url('start-ajax-filter'));

/**
 * Enqueues the plugins custom styling and scripts
 * 
 * @return void
 */
function start_ajax_filter_enqueue_style_scripts(): void
{
    // Don't load the scripts on the admin pages
    if (is_admin()) {
        return;
    }

    wp_enqueue_style('start_ajax_filter_style', START_AJAX_FILTER_PLUGIN_PATH . '/styles.css', '', '1.0');
    wp_enqueue_script('start_ajax_filter_script', START_AJAX_FILTER_PLUGIN_PATH . '/scripts.js', array('jquery'), '1.0');
    wp_localize_script('start_ajax_filter_script', 'start_ajax_filter_object', array('ajax_url' => admin_url('admin-ajax.php')));
}
add_action('init', 'start_ajax_filter_enqueue_style_scripts');

function filter_posts() {
    $post_type = $_GET['postType'];
    $title = $_GET['title'];
    $posts_per_page = $_GET['postsPerPage'];
    $page = $_GET['page'];
    $offset = ($page - 1) * $posts_per_page;

    $args = [
        'post_type' => $post_type,
        'posts_per_page' => $posts_per_page,
        's' => $title,
        // 'offset' => $offset
        'page' => $page
    ];

    $query = new WP_Query($args);
    $posts = $query->get_posts();

    if (empty($posts)) {
        wp_send_json_error();
        wp_die();
    }
    
    wp_send_json_success($posts);
    wp_die();
}
add_action( 'wp_ajax_nopriv_filter_posts', 'filter_posts' );
add_action( 'wp_ajax_filter_posts', 'filter_posts' );