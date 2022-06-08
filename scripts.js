var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AjaxFilter {
    constructor(form = null, postTemplate = null) {
        if (!form) {
            throw new Error('Missing argument 1 is a required parameter.');
        }
        if (!postTemplate) {
            throw new Error('Missing argument 2 is a required parameter.');
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
    setDefaultPosts() {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield this.fetchPosts();
            this.updatePostsContainer(posts);
        });
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
    setupLoadMore() {
        var _a;
        (_a = this.loadMoreElement) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            this.page += 1;
            this.loadMore();
        });
    }
    /**
     * Load more posts into the container
     * @returns void
     */
    loadMore() {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield this.fetchPosts();
            const loadMore = true;
            this.updatePostsContainer(posts, loadMore);
        });
    }
    /**
     * Setup the form listener for a submit event
     * @returns void
     */
    setupFormListener() {
        this.form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            this.page = 1;
            const posts = yield this.fetchPosts(e);
            this.updatePostsContainer(posts);
        }));
    }
    /**
     * Filters the posts based on the form attributes
     * @param e Event
     * @returns Promise
     */
    fetchPosts(e = null) {
        var _a;
        if (e)
            e.preventDefault();
        const postType = this.form.getAttribute("data-post-type") || "post";
        const postsPerPage = this.form.getAttribute("data-posts-per-page") || 5;
        const title = ((_a = this.form.querySelector("[data-title]")) === null || _a === void 0 ? void 0 : _a.value) || '';
        const taxonomies = {};
        this.taxonomies.forEach(taxonomy => {
            const value = document.querySelector(`[data-taxonomy=${taxonomy}]`).value;
            taxonomies[taxonomy] = value;
        });
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
                success: (data) => {
                    if (!data.success) {
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
        });
    }
    /**
     * Display an error message
     * @returns void
     */
    handleError() {
        const postsContainer = document.querySelector("[data-posts-container]");
        postsContainer.innerHTML = null;
        this.handleEmpty();
    }
    /**
     * Display an error message
     * @returns void
     */
    handleEmpty() {
        this.errorElement.setAttribute('data-posts-show-error', "true");
        this.errorElement.setAttribute('data-posts-show-load-more', "false");
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
    setPosts(posts) {
        this.posts = posts;
    }
    /**
     * Update the posts container with the new posts
     * @param posts Array
     * @returns void
     */
    updatePostsContainer(posts, loadMore = false) {
        const postsContainer = document.querySelector("[data-posts-container]");
        if (!loadMore) {
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
    initialisePostTemplate(post, template) {
        const postTemplate = this.stringToHTML(template);
        for (const key in post) {
            const formattedKey = key.toLowerCase().replace('_', '-');
            const selector = postTemplate.querySelector(`[data-${formattedKey}]`);
            if (!this.elementExists(selector))
                continue;
            selector.innerHTML = post[key];
        }
        return postTemplate;
    }
    /**
     * Convert a string of a HTML element to valid HTML
     * @param string string of the HTML element
     * @returns Element
     */
    stringToHTML(string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(string, 'text/html');
        return doc.querySelector('[data-post]');
    }
    ;
    /**
     * Check if the element exists
     * @param element
     * @returns bool if element exists
     */
    elementExists(element) {
        if (!element) {
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=scripts.js.map