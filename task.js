(function() {
    function getDateStr(dat) {
        var y = dat.getFullYear();
        var m = dat.getMonth() + 1;
        m = m < 10 ? '0' + m : m;
        var d = dat.getDate();
        d = d < 10 ? '0' + d : d;
        return y + '-' + m + '-' + d;
    }
    function randomBuildData(seed) {
        var returnData = {};
        var dat = new Date("2016-01-01");
        var datStr = '';
        for (var i = 1; i < 92; i++) {
            datStr = getDateStr(dat);
            returnData[datStr] = Math.ceil(Math.random() * seed);
            dat.setDate(dat.getDate() + 1);
        }
        return returnData;
    }

    var aqiSourceData = {
        "北京": randomBuildData(500),
        "上海": randomBuildData(300),
        "广州": randomBuildData(200),
        "深圳": randomBuildData(100),
        "成都": randomBuildData(300),
        "西安": randomBuildData(500),
        "福州": randomBuildData(100),
        "厦门": randomBuildData(100),
        "沈阳": randomBuildData(500)
    };


    // 以上是随机生成的数据

    //学习设计为mvc使数据和表现分离，分为model，view，controller
    //model,数据存储及处理相关
    var model = {
        data: aqiSourceData,
        cityNames: function() {
            var self = this;
            return Object.keys(self.data);
        },
        //处理数据，传入参数为城市，以及日期粒度，返回供渲染的数据
        processDate: function(city, unit) {
            var resultData = [],
                city = this.data[city],
                cityTime = Object.keys(city);
                //建立一个高阶函数，实现在reduce方法中再传入其他的参数
                function getResultData(fineness) {
                    return function(prev, cur, index) {
                        var data = prev + city[cur];
                        if((index + 1) % fineness == 0 || index == cityTime.length) {
                            resultData.push({
                                date: cur,
                                value: Math.floor(data/fineness)
                            })
                            return 0;
                        }else {
                            return data;
                        }
                    }
                }
                switch(unit) {
                    case 'day':
                    cityTime.reduce(getResultData(1),0);
                    break;
                    case 'week':
                    cityTime.reduce(getResultData(7),0);
                    break;
                    case 'month':
                    cityTime.reduce(getResultData(30),0);
                }
                return resultData;
        }
    };
    // view,视图渲染相关
    var view = {
        drawSelect: function() {
            var data = model.cityNames(),
                select = document.getElementById('city-select');
            data.forEach(function(city){
                var option = document.createElement('option');
                option.value = option.text = city;
                select.appendChild(option);
            });
        },
        drawChart: function(data) {
            var className,
                chart = document.querySelector('.api-chart-wrap'),
                maxValue = data.reduce(function(pre, cur) {
                    if(cur.value > pre) return cur.value;
                    else return pre;
                }, 0);
                if(data.length <= 3) className = 'month';
                else if(data.length > 3 && data.length < 90) className = 'week';
                else className = 'day';
                function getColor(airQuality) {

                    // 根据污染严重程度：绿 蓝 红 紫 黑
                    var colors = ['#008200', '#0100FD', '#FD0002', '#810381', '#000000'];

                    if (airQuality <= 50) return colors[0];
                    else if (airQuality < 100) return colors[1];
                    else if (airQuality < 200) return colors[2];
                    else if (airQuality < 300) return colors[3];
                    else return colors[4];
            }
            chart.innerHTML = '';
                data.forEach(function(data) {
                    var item = document.createElement('div');
                    item.className = className;
                    item.style.backgroundColor = getColor(data.value);
                    console.log(data);
                    item.style.height  = Math.floor(data.value/maxValue*100) + "%";
                    item.title = '日期：' + data.date + '  数值：' + data.value;
                    chart.appendChild(item);
                })
        }
    }
    // contorller,事件的绑定以及初始化相关状态
    var contorller = {
        init: function() {
            view.drawSelect();
            this.bindEvent();
            var data = model.processDate(this.status.city, this.status.unit);
                view.drawChart(data);
        },
        status: {
            city: '北京',
            unit: document.querySelector('[name="gra-time"]:checked').value
        },
        bindEvent: function() {
            var TimeForm = document.getElementById('form-gra-time'),
                citySelect = document.getElementById('city-select'),
                self = this;
            function handler(e) {
                var target = e.target;
                if(target.matches('input[name="gra-time"]')) {
                    self.status.unit = target.value;
                }else if(target.matches('#city-select')) {
                    self.status.city = target.value;
                }
                var data = model.processDate(self.status.city,self.status.unit);
                view.drawChart(data);
            }
            TimeForm.addEventListener('click', handler);
            citySelect.addEventListener('change', handler);
        }
    }
    contorller.init();
})()
