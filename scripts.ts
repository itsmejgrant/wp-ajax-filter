class AjaxFilter {

    form: HTMLFormElement;
    postTemplate: string;
    posts: Array<Element>;
    page: number;

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

        this.setDefaultPosts();
        this.setupLoadMore();
        this.setupFormListener();
    }

    /**
     * Set the default posts when the page loads
     * @returns Promise<void>
     */
    async setDefaultPosts(): Promise<void> {
        await this.filter();
    }

    /**
     * Setup the load more functionality
     * @returns void
     */
    setupLoadMore(): void {
        const loadMoreButton = document.querySelector("[data-load-more]");
        loadMoreButton?.addEventListener("click", () => {
            this.page += 1;
            this.loadMore();   
        });
    }

    /**
     * Load more posts into the container
     * @returns void
     */
    loadMore() {
        const postsContainer = document.querySelector("[data-posts-container]");
        
        postsContainer.innerHTML = null;
    }

    /**
     * Setup the form listener for a submit event
     * @returns void
     */
    setupFormListener(): void {
        this.form.addEventListener('submit', async (e: Event) => await this.filter(e));
    }

    /**
     * Filters the posts based on the form attributes
     * @param e Event
     * @returns Promise
     */
    filter(e = null): Promise<any> {
        if (e) e.preventDefault();
        const postType = this.form.getAttribute("data-post-type") || "post";
        const postsPerPage = this.form.getAttribute("data-posts-per-page") || 5;
        const title = this.form.querySelector<HTMLInputElement>("[data-title]")?.value || '';

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
                    page: this.page
                },
                success: (data: ResponseObject) => {
                    if (! data.success) {
                        this.handleError();
                        return;
                    }

                    const posts = data.data;
                    this.setPosts(posts)
                    resolve(posts);
                },
                error: this.handleError()
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
        const errorElement = document.querySelector('[data-posts-error]');
        errorElement.setAttribute('data-posts-show-error', "true");
    }

    /**
     * Get the array of posts
     * @returns Array<Element> array of posts
     */
    getPosts() {
        return this.posts;
    }

    /**
     * Set the posts property and update the posts container
     * @param posts Array<Element>
     * @returns void
     */
    setPosts(posts: Array<Element>): void {
        this.posts = posts;
        
        this.updatePostsContainer(this.posts);
    }

    /**
     * Update the posts container with the new posts
     * @param posts Array
     * @returns void
     */
    updatePostsContainer(posts: Array<any>): void {
        const postsContainer = document.querySelector("[data-posts-container]");
        postsContainer.innerHTML = null;

        // Hide the error
        const errorElement = document.querySelector('[data-posts-error]');
        errorElement.setAttribute('data-posts-show-error', "false");
        
        posts.forEach(post => {
            const article = this.stringToHTML(this.postTemplate);
            // const postObject = this.createPostObject(post);
            const dataAttributes = ['id', 'title', 'content', 'excerpt', 'date'];
            const postObject = {
                id: post.ID,
                title: post.post_title,
                content: post.post_content,
                excerpt: post.post_excerpt,
                date: post.post_date
            }

            dataAttributes.forEach(attr => {
                const selector = article.querySelector(`[data-post-${attr}]`);
                if (! this.elementExists(selector)) return;

                selector.innerHTML = postObject[attr];
            });

            postsContainer.insertAdjacentElement('beforeend', article);
        });
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