# set working directory
setwd('source/data')

# to understand a given function use ?functionName or help('functionName') to initialise help 
# load XLConnect - for reading data from excel spreadsheet
# if you get an error loading XLConnect run this command outside of reith proxies install.packages('XLConnect')
library('XLConnect')
# load sqldf for data preprocessing
library('sqldf')
# we'll need the rjson module too
library('rjson')

# read UN dataset from spreadsheet workbook
datasetWorkbook <- loadWorkbook('dataset_rounded_sc.xlsx')
# check the worksheets in the spreadsheet
getSheets(datasetWorkbook)
# read data from the "All Estimates 1990-2012" worksheet
mortality_data <- readWorksheet(datasetWorkbook, sheet='Sheet1')

# replace '.' in column names with '_'
colnames(mortality_data) <- gsub('\\.', '_', colnames(mortality_data))


# update row names 
rownames(mortality_data) <- mortality_data[,1]
# drop column 1 as it is now in the row names
mortality_data <- mortality_data[,-1]
mortality_data[1:10,1:5]

# if you want the dataset as csv
write.csv(mortality_data, 'africa_data_2013_sc.csv')
# write dataset to json
# save as an amd module
write(paste('define(',toJSON(as.data.frame(t(mortality_data))), ');', sep=''), 'africa_data_2013_sc.js')

# pdf(file = "plots_by_year.pdf")
# par(mfrow=c(2,2))
# noquote('africa_data$U5MR_1990')
# 
# for(year in 2:24) {
#     print(africa_data[,year])
#     
#     hist(as.numeric(africa_data[,year]), main=(1988 + year), xlab='rate per 1000', ylab='number of countries', xlim=c(0,350), ylim=c(0,15), n=14)
# }
# 
# dev.off();
# 
# hist(as.numeric(africa_data$NMR_2012), main=('1990'), xlab='rate per 1000', ylab='number of countries', xlim=c(0,60), ylim=c(0,15), n=14)