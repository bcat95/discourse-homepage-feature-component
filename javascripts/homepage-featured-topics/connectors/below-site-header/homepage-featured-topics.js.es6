import { ajax } from "discourse/lib/ajax";
import Topic from "discourse/models/topic";
import { withPluginApi } from "discourse/lib/plugin-api";

const FEATURED_CLASS = "homepage-featured-topics";

export default {
    setupComponent(args, component) {
        const topMenuRoutes = Discourse.SiteSettings.top_menu
            .split("|")
            .filter(Boolean)
            .map(route => `/${route}`);

        const homeRoute = topMenuRoutes[0];

        withPluginApi("0.1", api => {
            api.onPageChange(url => {

                const home = url === "/" || url.match(/^\/\?/) || url === homeRoute;

                let showBannerHere;
                var topics_json = settings.featured_json;
                var is_show_category_list = true;

                if (settings.featured_tag != '') topics_json = `/tags/${settings.featured_tag}.json`;

                // Set showBannerHere
                if (settings.show_on === "homepage") {
                    showBannerHere = home;
                } else if (settings.show_on === "top_menu") {
                    showBannerHere = topMenuRoutes.indexOf(url) > -1 || home;
                } else {
                    url = url.split("?");
                    if (url.length > 0 && url[0] != "") url = url[0];
                    showBannerHere = (url == "/" || url.match(/\/c\/.*/) || url.match(/\/tag\/.*/));
                    // showBannerHere = url.match(/.*/) && !url.match(/search.*/) && !url.match(/admin.*/);
                }

                // Set topics_json
                if (url.match(/\/c\/.*/) || url.match(/\/tag\/.*/)){
                    // Cat & Tag
                    var is_show_category_list = false;
                    var cat_url = url;
                    cat_url = cat_url.split("?");
                    if (cat_url.length > 0 && cat_url[0] != "") {
                        cat_url = cat_url[0];
                        topics_json = `${cat_url}.json`;
                    }
                }

                if (showBannerHere) {
                    document.querySelector("html").classList.add(FEATURED_CLASS);

                    component.setProperties({
                        displayHomepageFeatured: true,
                        loadingFeatures: true,
                        displayCategoryList: is_show_category_list
                    });

                    const titleElement = document.createElement("h2");
                    titleElement.innerHTML = settings.title_text;
                    component.set("titleElement", titleElement);

                    // Get topics from url
                    ajax(topics_json)
                        .then(result => {

                            let customTopics = [];
                            let hideCategory = [];
                            if (settings.hide_category != '') hideCategory = $.map(settings.hide_category.split(","), function(value){
                                return parseInt(value, 10);
                            });
                        
                            // Topics from these categories are not shown
                            result.topic_list.topics.forEach(function(topic, index) {
                                if (hideCategory.indexOf(topic.category_id) == -1) {
                                    customTopics.push(topic);
                                }
                            });

                            // Component customFeaturedTopics
                            let customFeaturedTopics = [];
                            customTopics
                                .slice(0, 4)
                                .forEach(topic =>
                                    customFeaturedTopics.push(Topic.create(topic))
                                );
                            component.set("customFeaturedTopics", customFeaturedTopics);

                            // component customLatestTopicsLeft
                            let customLatestTopicsLeft = [];
                            customTopics
                                .slice(4, 12)
                                .forEach(topic =>
                                    customLatestTopicsLeft.push(Topic.create(topic))
                                );
                            component.set("customLatestTopicsLeft", customLatestTopicsLeft);

                            // component customLatestTopicsRight
                            let customLatestTopicsRight = [];
                            customTopics
                                .slice(13, 29)
                                .forEach(topic =>
                                    customLatestTopicsRight.push(Topic.create(topic))
                                );
                            component.set("customLatestTopicsRight", customLatestTopicsRight);

                        })
                        .finally(() => component.set("loadingFeatures", false))
                        .catch(e => {
                            // the featured tag doesnt exist
                            if (e.jqXHR && e.jqXHR.status === 404) {
                                document.querySelector("html").classList.remove(FEATURED_CLASS);
                                component.set("displayHomepageFeatured", false);
                            }
                        });
                } else {
                    document.querySelector("html").classList.remove(FEATURED_CLASS);
                    component.set("displayHomepageFeatured", false);
                }

                if (settings.show_for === "everyone") {
                    component.set("showFor", true);
                } else if (
                    settings.show_for === "logged_out" &&
                    !api.getCurrentUser()
                ) {
                    component.set("showFor", true);
                } else if (settings.show_for === "logged_in" && api.getCurrentUser()) {
                    component.set("showFor", true);
                } else {
                    component.set("showFor", false);
                    document.querySelector("html").classList.remove(FEATURED_CLASS);
                }
            });
        });
    }
};
