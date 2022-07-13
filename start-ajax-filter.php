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

define('START_AJAX_FILTER_ROOT_DIR_PATH', plugin_dir_url(__FILE__));
define('START_AJAX_FILTER_VERSION', '1.0');

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
    wp_enqueue_script('start_ajax_filter_script', START_AJAX_FILTER_ROOT_DIR_PATH . '/scripts.js', array('jquery'), START_AJAX_FILTER_VERSION);
    wp_localize_script('start_ajax_filter_script', 'start_ajax_filter_object', array('ajax_url' => admin_url('admin-ajax.php')));
}
add_action('init', 'start_ajax_filter_enqueue_style_scripts');

function filter_posts() {
    $post_type = $_GET['postType'];
    $title = $_GET['title'];
    $posts_per_page = $_GET['postsPerPage'];
    $page = $_GET['page'];
    $taxonomies = $_GET['taxonomies'] ?? null;
    $acf_fields = $_GET['acfFields'] ?? null;
    $args = [
        'post_type' => $post_type,
        'posts_per_page' => $posts_per_page,
        '_meta_or_title' => $title,
        'paged' => $page
    ];
    $meta_query = [];

    // Loop through ACF keys and add make them searchable
    foreach ($acf_fields as $acf_field) {
        $meta_query[] = [
            'key' => $acf_field,
            'value' => $title,
            'compare' => 'LIKE'
        ];
    }

    // If there is more than one meta query 'or' them
    if(count($meta_query) > 1) {
        $meta_query['relation'] = 'OR';
    }

    // Push meta query into $args  
    $args['meta_query'] = $meta_query;

    // If they're set, add the taxonomies to the query
    if ($taxonomies) {
        $args['tax_query'] = array();
        $args['tax_query']['relation'] = 'AND';

        foreach ($taxonomies as $key => $value) {
            if ($value === 'all') continue;

            $args['tax_query'][] = array(
                'taxonomy' => $key,
                'field'    => 'slug',
                'terms'     => $value
            );
        }
    }

    $query = new WP_Query($args);
    $posts = $query->get_posts();

    // Grab any ACF values
    foreach ($posts as $post) {
        $post->acf = [];
        foreach($acf_fields as $index => $acf_field) {
            $post->acf[$index]['key'] = $acf_field;
            $post->acf[$index]['value'] = get_post_custom_values($acf_field, $post->ID)[0];
        }
    }

    if (empty($posts) && $page === 1) {
        wp_send_json_error();
        wp_die();
    }

    wp_send_json_success($posts);
    wp_die();
}
add_action( 'wp_ajax_nopriv_filter_posts', 'filter_posts' );
add_action( 'wp_ajax_filter_posts', 'filter_posts' );

/**
 * Modify the search so that we can search through custom fields as well
 * @param $query
 * 
 * https://wordpress.stackexchange.com/questions/78649/using-meta-query-meta-query-with-a-search-query-s
 */
function start_ajax_filter_modify_search($query)
{
    if (! $query->get('_meta_or_title')) {
        return;
    }   

    $title = $query->get('_meta_or_title');
    add_filter('get_meta_sql', function($sql) use ($title) {
            global $wpdb;

            // Only run once:
            static $nr = 0; 
            if( 0 != $nr++ ) return $sql;

            // Modified WHERE
            $sql['where'] = sprintf(
                " AND ( %s OR %s ) ",
                $wpdb->prepare( "{$wpdb->posts}.post_title like '%%%s%%'", $title),
                mb_substr( $sql['where'], 5, mb_strlen( $sql['where'] ) )
            );

            return $sql;
    });
};
add_action('pre_get_posts', 'start_ajax_filter_modify_search');
