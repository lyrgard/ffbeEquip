class VirtualScroll {
    constructor(container, itemToHtmlFunction, minItemHeight, wholePageScroll = true) {
        this.container = container;
        this.itemToHtml = itemToHtmlFunction;
        this.minItemHeight = minItemHeight;
        if (wholePageScroll) {
            this.containerOffset = container.offset().top;    
            this.scrollableElement = $(document.documentElement);
            this.windowHeight = $(window).height();
            $(window).on('scroll', $.throttle(150, () => this.render()));
        } else {
            this.containerOffset = 0;
            this.scrollableElement = container;
            this.windowHeight = container.height();
            container.on('scroll', $.throttle(150, () => this.render()));
        }
    }
    
    display(items) {
        this.itemInfos = [];
        this.items = items;
        let position = 0;
        items.forEach(i => {
            this.itemInfos.push({
                position: position,
                default:true,
                height: this.minItemHeight
            });
            position += this.minItemHeight;
        });
        this.totalHeight = position;
        this.firstItemIndex = -1;
        this.lastItemIndex = -1;
        this.render();
    }
    
    render() {
        if (this.items.length > 0) {
            if (this.firstItemIndex !== -1) {
                this.updateHeights();
            }

            let documentScrollTop = this.scrollableElement.scrollTop();
            let topVisible = Math.max(documentScrollTop - this.containerOffset, 0);
            let bottomVisible = this.windowHeight - this.containerOffset + documentScrollTop;

            let firstItemIndex;
            if (topVisible === 0) {
                firstItemIndex = 0;
            } else {
                firstItemIndex = Math.min(Math.floor((topVisible / this.totalHeight * this.items.length)), this.items.length - 1);
                if (firstItemIndex >= this.items.length) {
                    console.log('!!');
                }
                while (this.itemInfos[firstItemIndex].position < topVisible && firstItemIndex < this.items.length - 1) {
                    firstItemIndex++;
                }
                while (this.itemInfos[firstItemIndex].position > topVisible) {
                    firstItemIndex--;
                }
            }
            let lastItemIndex = firstItemIndex;
            while (this.itemInfos[lastItemIndex].position < bottomVisible && lastItemIndex < this.items.length -1 ) {
                lastItemIndex++;
            }

            // draw some more items outside to prevent seeing blank area
            firstItemIndex = Math.max(firstItemIndex - 4, 0);
            lastItemIndex = Math.min(lastItemIndex + 4, this.items.length - 1);

            this.container.empty();
            let html = '<div style="height:' + this.itemInfos[firstItemIndex].position + 'px"></div>';
            let itemsHeight = 0;
            for (i = firstItemIndex; i <= lastItemIndex; i++) {
                html += this.itemToHtml(this.items[i]);
                itemsHeight += this.itemInfos[i].height;
            }
            html += '<div style="height:' + (this.totalHeight - this.itemInfos[firstItemIndex].position - itemsHeight) + 'px"></div>';
            this.container.html(html);
            this.firstItemIndex = firstItemIndex;
            this.lastItemIndex = lastItemIndex;
        } else {
            this.container.empty();
        }
    }
    
    updateHeights() {
        let children = this.container.children();
        let deviation = 0;
        for (i = 1; i < children.length - 1; i++) {
            let e = children[i];
            let index = i - 1;
            let itemInfo = this.itemInfos[this.firstItemIndex + index];
            itemInfo.position += deviation;
            if (!this.itemInfos.default) {
                let itemHeight = e.getBoundingClientRect().height;
                deviation += Math.floor(itemHeight - itemInfo.height);
                itemInfo.height = itemHeight;
                itemInfo.default = false;
            }
        }
        for (i = this.lastItemIndex + 1; i < this.items.length; i++) {
            this.itemInfos[i].position += deviation;
        }
        this.totalHeight += deviation;
    }
}