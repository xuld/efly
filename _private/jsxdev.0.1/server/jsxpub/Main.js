
include('jsxpub/PublicAtion.js');

define(function() {

    var pub = new jsxpub.PublicAtion();
    pub.map = true;
    
    function error(err){
        console.log(err);
        process.exit();
    }

    pub.client(Jsx.format('../client/'), Jsx.format('../../../../../client/'), function(err) {
        if (err){
            return error(err);
        }
        //console.log('output:');
        //console.log(pub.output.join('\n'));
        
        pub.server(Jsx.format('../server/'), Jsx.format('../../../../../server/'), function(err){
            if(err)
                return error(err);
            console.log('发布完成,重启服务!');
            //process.exit();
        });
    });

});