#!/usr/bin/env python3
import string, os, time, json, re, unicodedata, html.parser, requests

# Bon appetit cafe hours api url
url = "http://legacy.cafebonappetit.com/api/2/cafes"
# How many cafeterias you want to parse (in order)
totalCafes = 1818
# What our file should be named
fileName = "data.json"


# Parser to clean up the string names
h = html.parser.HTMLParser()
# Time when we started the script
start = time.time()

def appendData(cafeId, cafeName, cafeLoc):
	print(cafeId + ") " + cafeName + " in " + cafeLoc)
	return {'id':cafeId, 'label':cafeName, 'desc':cafeLoc}


def clean(stringToClean):
	# Remove beginning and ending whitespace
	string = stringToClean.strip()
	# Replace html
	cleanString = h.unescape(string)
	# Replace unicode
	return unicodedata.normalize('NFKD', cleanString)


# Finds the cafeteria id and name
def getBonAppMenuData(url, id):
	params = {'cafe': id}
	response = requests.get(url, params=params)
	data = response.json()

	try:
		# Grab cafe Id from JSON
		cafeId = list(data["cafes"].keys())[0]

		# Grab cafe name from JSON
		cafeName = data["cafes"][cafeId]["name"]


		# We want to display titles at least. We can do without location.
		# Grab cafe city from JSON
		cafeCity = data["cafes"][cafeId].get("city", "")

		# Grab cafe state from JSON
		cafeState = data["cafes"][cafeId].get("state", "")

		# Formatting city and state strings
		# Both empty
		if cafeCity == "" and cafeState == "":
			cafeLoc = "No location listed"
		# Only city
		elif cafeCity != "" and cafeState == "":
			cafeLoc = clean(cafeCity)
		# Only State
		elif cafeCity == "" and cafeState != "":
			cafeLoc = clean(cafeState)
		# City and State
		else:
			cafeLoc = clean(cafeCity) + ", " + clean(cafeState)


		# Clean up the cafe name
		cafeName = clean(cafeName)

		# Construct the full return string
		return appendData(cafeId, cafeName, cafeLoc)
	except:
		print('[Skipping. Moving on...]')
		pass

# Round numbers to a decimal point
def num2str(num, precision):
	return "%0.*f" % (precision, num)

# Get the outfile's size
def calculateFileSize():
	return str(os.path.getsize(fileName))


def main():
	# Our constructed JSON data
	responseData = []

	# Loop through the "known" amount of cafes
	for num in range(0, totalCafes):
		data = getBonAppMenuData(url, num)
		# Append if it's not null
		if data is not None:
			responseData.append(data)
		time.sleep(3)

	# Write our output to a file
	with open(fileName, 'w') as outfile:
		# Output the data into a file
		json.dump(responseData, outfile)
		# Save the runtime
		endTime = time.time() - start;

	print('')
	print('File: ' + fileName)
	print('Size: ' + calculateFileSize() + ' bytes')
	print('This took ' + num2str(endTime, 2) + ' seconds\n')

if __name__ == '__main__':
	main()
