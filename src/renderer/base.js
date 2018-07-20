/**
 * Created by zhouhh on 2018/7/19.
 */
async function postRequest(url, params) {
    return new Promise((resolve, reject) => {
        Vue.http.post(
            url,
            {
                params
            },
            {emulateJSON: false}
        )
            .then((res) => {    //成功胡回调
                resolve(res.body);
            })
            .catch((res) => {   //失败的回掉
                reject(res.body);
            });
    });
}

exports.install = function (Vue, options) {
    Vue.prototype.postRequest = postRequest;
    Vue.prototype.text2 = function () {//全局函数2
        alert('执行成功2');
    };
}