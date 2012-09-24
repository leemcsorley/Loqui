for %%f in (./test_data/*.js) do (
    echo %%~nf
    node "./node_modules/couchapp/bin.js" push "./test_data/%%~nf.js" http://localhost:5984/loqui
)