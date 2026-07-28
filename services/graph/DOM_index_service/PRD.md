**Overview**

**Playwright Modules**
Here are the following modules which you need to develop using playwright's Python SDK, but before proceeding, you have to make sure to include the Python SDK for playwright in the @pyproject.toml file. here are the modules:
1. Opening a link when provided a URL. This functionality should be capable of opening that specific URL and going into that URL.
2. Clicking will be provided coordinates (four coordinates). Assume that there is a rectangle, and the top-left, bottom-left, top-right, and bottom-right are the four coordinates which you will be provided. What this function internally should do is try to figure out the center point using these four points. This is a simple mathematical calculation, and once you find the center point, it should be clicking on the center point so again coming back and giving a complete overview. This method will accept four coordinates. After receiving the four coordinates, it should identify the center point and then click on that center point.
3. Going back. In the browser, you can always go back by clicking the back button or simply using the widget by dragging towards the right with two fingers. Use playwright to implement this functionality so that we can go back in the browser.
4. Taking a screenshot. Write a Python method which can take a screenshot of the UI page.

Now all the above four modules have to be inside of a class called PlaywrightUtils.

**The UI indexing algorithm**
Let's discuss the UI indexing algorithm now. The general idea is to build a pipeline which can map out different states of the frontend. What do I mean by a state? Let's say you're working on a dashboard which might have multiple buttons, multiple forms, and all. Now we need to develop an algorithm which will basically identify what is going to happen when you click a certain button. By the end of the algorithm, once it completes its execution, you'll have a huge graph data structure where you can identify how to go from one state to the other state using the graph. This graph data structure is going to be very helpful for us and doing multiple things.

*The ideal agorithm*
The ideal algorithm is about parsing the graph or parsing the UI into a graph, but let's not talk about that now  because persistence is going to come later in the later sections.
In this ideal flow:
1. You open the base URL.
2. You take a screenshot.
3. You detect all the UI elements. Detection gives you the coordinates, so using these coordinates you click on each of these coordinates and understand the state. Each of these states should have a screenshot.
4. This all happens again in the above three steps until two of these conditions get satisfied. These two conditions are:
- If the graph ends, that means if you have reached the end state of an application.
- If you have a cycle in the graph, that means you are visiting an already visited component.

*version which we want to build in this session*
This is version one, and for the sake of simplicity, we will not include the functionalities to check whether a cycle is present (meaning if you are visiting the same component again), or whether this is the end of the graph node (you cannot go further). It cannot have more children. In this, we will be having a config. In this config, we're going to set a recursive limit which decides how deep you can go in the UI components. When you start out with a parent node that is depth one, then you detect all the UI elements, and then you click on each of the UI elements. They will have their own states, and whatever has happened by clicking on each of these UI elements is going to be a child state of the parent node. All of these UI component states will be at depth level two, immediate children of the parent. After each of these states, each of these states will also have a couple of UI components. Clicking those will give you more depth. After getting all the depth of all the nodes in level two, all of these will be in level three. Each level, you check whether you have reached the recursive limit or not. If you have reached a recursive limit, you're going to stop generating the graph. In this way, you don't really have to care whether it's the end or whether it's a cycle. Recursive limit always breaks, and it's always going to be three in our case.

**Persistence**
We will not be storing the graph data structure in a database for now. What we will do instead is store the graph in the format of JSON in a JSON file. How do we store this? In a JSON file, we store a list of dictionaries, and each dictionary will have a couple of values. These values include:
- node_id
- node_description
- state_screenshot
- child_nodes  Using these child nodes, you can understand whoever or whatever the children of the current existing parent are. This will give you a directed graph that is pretty much enough for now. In the `state_screenshot` parameter, we will be storing the base64 of the screenshot taken.

**File structure**
how do we want these files to be created and what structure, and where are they supposed to be? For that, we have a folder called tempdb for persistence. Let's talk about how we want to process this JSON first. Under tempdb, you are going to store a lot of JSON files, so for each run of a DOM parser class, there will be a single graph. Now, how do we create? What is the naming format of these files? It's going to be graph_{count}, and this count is a parameter. For each run, what you will do is, before saving, you will read the directory and you will check what is the highest number present. You can use this by simply getting all the names of the files and splitting it for count. After splitting it, if there are no files present, you will start with one. Otherwise, you'll pick the number which is greater than the highest count which is already present. This is the naming structure of all the files under tempdb where we will be storing JSON graphs. 

 let's talk about the config. We've spoken about the recursive limit. All the config needs to go into the file called @config.py That is where we'll be storing our config for the recursive limit. 
 
Then comes the playwright modules. In this section, there is a directory called utils under graph. In this utils, we'll be storing all the utilities needed for the DOM parser and playwright. All the four methodologies which I've told you under this class name called playwright-utils, you need to create this class inside of the utils directory.for DOMparsing you need put files under DOM_index_service directory. According to me, one file will be enough for the class DOM parser. Inside DOM parser, you can add different functionalities or methods to achieve what we want to do, which is the version one of the graph which I mentioned above.