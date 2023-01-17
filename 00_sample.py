#!/usr/bin/env python
# coding: utf-8

# In[10]:


import streamlit as st  # pip install streamlit
import pandas as pd  # pip install pandas
import base64  # Standard Python Module
from io import StringIO, BytesIO  # Standard Python Module
from stqdm import stqdm




def get_jaccard_sim(str1, str2): 
    a = set(str1.split()) 
    b = set(str2.split())
    c = a.intersection(b)
    return float(len(c)) / (len(a) + len(b) - len(c))



def generate_excel_download_link(df):
    # Credit Excel: https://discuss.streamlit.io/t/how-to-add-a-download-excel-csv-function-to-a-button/4474/5
    towrite = BytesIO()
    df.to_excel(towrite, encoding="utf-8", index=False, header=True)  # write to BytesIO buffer
    towrite.seek(0)  # reset pointer
    b64 = base64.b64encode(towrite.read()).decode()
    href = f'<a href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,{b64}" download="data_download.xlsx">Download Excel File</a>'
    return st.markdown(href, unsafe_allow_html=True)



st.set_page_config(page_title='자카드')
st.title('엑셀_유사도변환 📈')
st.subheader('Feed me with your Excel file')

uploaded_file = st.file_uploader('Choose a XLSX file', type='xlsx')
if uploaded_file:
    st.markdown('---')
    df = pd.read_excel(uploaded_file, engine='openpyxl')
    st.dataframe(df)
    
    ddf = pd.merge(df,df, on=['고교코드','과목'], how = 'left')
    
    ddf1 = ddf[ddf['수험번호_x']!=ddf['수험번호_y']]
    
    자카드 =[]


    for i in stqdm(ddf1.index):
        하나 = ddf1['세특1_x'][i]
        두울 = ddf1['세특1_y'][i]

        유사 = get_jaccard_sim(하나,두울)

        자카드.append(유사)
        
    ddf1['자카드'] = 자카드
    
   # st.dataframe(ddf1)
    
    
   
    ddf2 = ddf1[['수험번호_x', '합격_x', '모집단위_x','편제_x','과목','수험번호_y','편제_y','자카드']]	
    
    


    # -- DOWNLOAD SECTION
    st.subheader('Downloads:')
    generate_excel_download_link(ddf2)
#     generate_html_download_link(m)






