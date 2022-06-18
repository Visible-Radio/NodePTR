// We can directly compare output files
/*
const file1 = fs.readFileSync("./PTR_output/test.gif")
const file2 = fs.readFileSync("./PTR_output/test copy.gif")
file1.equals(file2) // -> true

const file3 = fs.readFileSync("./PTR_output/someOtherFile.gif")
file1.equals(file2) // -> false
*/

/*
In order to do this, we'll need to be able to run the entire program from the test
Currently the only way to pass params is via the command line
So we'll need a wrapper function we can call, passing in args

We'll probably have to manually clean up after each test, deleting the test output
 */
