class AjaxFilter {

    form: HTMLFormElement;
    postTemplate: string;
    posts: Array<Element>;
    page: number;
    loadMoreElement: HTMLElement;
    errorElement: HTMLElement;
    taxonomies: Array<string>;

    constructor(form = null, postTemplate = null) {
        if (! form) {
            throw new Error('Missing argument 1 is a required parameter.')
        }

        if (! postTemplate) {
            throw new Error('Missing argument 2 is a required parameter.')
        }

        this.form = form;
        this.postTemplate = postTemplate;
        this.posts = [];
        this.page = 1;
        this.loadMoreElement = document.querySelector("[data-load-more]");
        this.errorElement = document.querySelector('[data-posts-error]');
        this.taxonomies = [];

        this.setDefaultPosts();
        this.setupTaxonomies();
        this.setupLoadMore();
        this.setupFormListener();
    }

    /**
     * Set the default posts when the page loads
     * @returns Promise<void>
     */
    async setDefaultPosts(): Promise<void> {
        const posts = await this.fetchPosts();
        this.updatePostsContainer(posts);
    }

    /**
     * Setup the taxonomies property
     * @returns void
     */
    setupTaxonomies() {
        const taxonomies = document.querySelectorAll('select[data-taxonomy]');
        taxonomies.forEach((taxonomy) => this.taxonomies.push(taxonomy.getAttribute('data-taxonomy')));
    }

    /**
     * Setup the load more functionality
     * @returns void
     */
    setupLoadMore(): void {
        this.loadMoreElement?.addEventListener("click", () => {
            this.page += 1;
            this.loadMore();   
        });
    }

    /**
     * Load more posts into the container
     * @returns void
     */
    async loadMore() {
        const posts = await this.fetchPosts();
        const loadMore = true;
        this.updatePostsContainer(posts, loadMore)
    }

    /**
     * Setup the form listener for a submit event
     * @returns void
     */
    setupFormListener(): void {
        this.form.addEventListener('submit', async (e: Event) => {
            this.page = 1;
            const posts = await this.fetchPosts(e);
            this.updatePostsContainer(posts);
        });
    }

    /**
     * Filters the posts based on the form attributes
     * @param e Event
     * @returns Promise
     */
    fetchPosts(e = null): Promise<any> {
        if (e) e.preventDefault();
        const postType = this.form.getAttribute("data-post-type") || "post";
        const postsPerPage = this.form.getAttribute("data-posts-per-page") || 5;
        const title = this.form.querySelector<HTMLInputElement>("[data-title]")?.value || '';

        const taxonomies = {};
        this.taxonomies.forEach(taxonomy => {
            const value = document.querySelector<HTMLSelectElement>(`[data-taxonomy=${taxonomy}]`).value;
            taxonomies[taxonomy] = value;
        })

        return new Promise((resolve, _reject) => {
            // @ts-ignore: jQuery comes from WordPress
            jQuery.ajax({
                type: "get",
                dataType: "json",
                // @ts-ignore: URL comes from WordPress
                url: start_ajax_filter_object.ajax_url,
                data: {
                    action: 'filter_posts',
                    postType: postType,
                    title: title,
                    postsPerPage: postsPerPage,
                    page: this.page,
                    taxonomies: taxonomies
                },
                success: (data: ResponseObject) => {
                    if (! data.success) {
                        this.handleError();
                        return;
                    }

                    const posts = data.data;

                    if (posts.length === 0) {
                        this.handleEmpty();
                    }

                    resolve(posts);
                    return posts;
                },
            });
        })
    }

    /**
     * Display an error message
     * @returns void
     */
    handleError(): void {
        const postsContainer = document.querySelector("[data-posts-container]");
        postsContainer.innerHTML = null;
        this.handleEmpty();
    }

    /**
     * Display an error message
     * @returns void
     */
    handleEmpty(): void {
        this.errorElement.setAttribute('data-posts-show-error', "true");
        this.errorElement.setAttribute('data-posts-show-load-more', "false");
    }

    /**
     * Get the array of posts
     * @returns Array<Element> array of posts
     */
    getPosts(): Array<Element> {
        return this.posts;
    }

    /**
     * Set the posts property and update the posts container
     * @param posts Array<Element>
     * @returns void
     */
    setPosts(posts: Array<Element>): void {
        this.posts = posts;
    }

    /**
     * Update the posts container with the new posts
     * @param posts Array
     * @returns void
     */
    updatePostsContainer(posts: Array<any>, loadMore: boolean = false): void {
        const postsContainer = document.querySelector("[data-posts-container]");

        if (! loadMore) {
            postsContainer.innerHTML = null;
        }

        // Hide the error
        const errorElement = document.querySelector('[data-posts-error]');
        errorElement.setAttribute('data-posts-show-error', "false");
        
        posts.forEach(post => {
            const article = this.initialisePostTemplate(post, this.postTemplate);
            // const article = this.stringToHTML(this.postTemplate);
            // const postObject = this.createPostObject(post);
            // const dataAttributes = ['id', 'title', 'content', 'excerpt', 'date'];

            postsContainer.insertAdjacentElement('beforeend', article);
        });
    }

    /**
     * Assigns the specified post content to the template
     * 
     * @param PostObject the post object
     * @param string the post template
     * @returns Element
     */
    initialisePostTemplate(post: PostObject, template: string): Element {
        const postTemplate = this.stringToHTML(template);        

        for (const key in post) {
            const formattedKey = key.toLowerCase().replace('_', '-');
            const selector = postTemplate.querySelector(`[data-${formattedKey}]`);
            
            if (! this.elementExists(selector)) continue;
            
            selector.innerHTML = post[key];
        }
        
        return postTemplate;
    }

    /**
     * Convert a string of a HTML element to valid HTML
     * @param string string of the HTML element
     * @returns Element
     */
    stringToHTML(string: string): Element {
        const parser = new DOMParser();
        const doc = parser.parseFromString(string, 'text/html');
        return doc.querySelector('[data-post]');
    };

    /**
     * Check if the element exists
     * @param element
     * @returns bool if element exists
     */
    elementExists(element: Element): boolean {
        if (! element) {
            return false;
        }

        return true;
    }
}

interface ResponseObject {
    success: boolean,
    data?: Array<any>
} 

interface PostObject {
    ID: number
    comment_count: string
    comment_status: string
    filter: string
    guid: string
    menu_order: number
    ping_status: string
    pinged: string
    post_author: string
    post_content: string
    post_content_filtered: string
    post_date: string
    post_date_gmt: string
    post_excerpt: string
    post_mime_type: string
    post_modified: string
    post_modified_gmt: string
    post_name: string
    post_parent: number
    post_password: string
    post_status: string
    post_title: string
    post_type: string
    to_ping: string
}