import streamlit as st
import pandas as pd
import joblib
import plotly.express as px

@st.cache_data
def load_data():
    df = pd.read_csv("full_game_data.csv")
    df['move_number'] = df.index + 1
    return df

df = load_data()

@st.cache_resource
def load_model():
    return joblib.load("near_loss_model.pkl")

model = load_model()

st.title("لوحة تحكم وتحليل لعبة 2048 👑")

st.subheader("معاينة بيانات الحركات")
st.write(df.head())

st.write(f"عدد الحركات المسجلة: {len(df)}")

fig_time = px.line(df, x='move_number', y='MoveTime(ms)', title='⏱️ الزمن بين الحركات')
st.plotly_chart(fig_time, use_container_width=True)

fig_max_tile = px.histogram(df, x='MaxTile', nbins=10, title='📈 أعلى بلاطة وصلت لها')
st.plotly_chart(fig_max_tile, use_container_width=True)

move_counts = df['Direction'].value_counts().reset_index()
move_counts.columns = ['Direction', 'Count']
fig_move_dir = px.bar(move_counts, x='Direction', y='Count', title='تحليل اتجاهات الحركة')
st.plotly_chart(fig_move_dir, use_container_width=True)

st.header("تنبؤ الخطر")

score = st.number_input("Score (النقاط)", min_value=0)
max_tile = st.number_input("MaxTile (أعلى بلاطة)", min_value=0)
move_time = st.number_input("MoveTime(ms) (الزمن بين الحركات)", min_value=0)
empty_tiles = st.number_input("EmptyTiles (عدد الخانات الفارغة)", min_value=0)

if st.button("تنبؤ"):
    input_data = pd.DataFrame([{
        'Score': score,
        'MaxTile': max_tile,
        'MoveTime(ms)': move_time,
        'EmptyTiles': empty_tiles
    }])
    st.write("🔍 البيانات المدخلة للنموذج:")
    st.write(input_data)

    try:
        prediction = model.predict(input_data)[0]
        st.success(f"✅ التنبؤ: {'⚠️ خطر وشيك' if prediction == 1 else 'آمن ✅'}")
    except Exception as e:
        st.error(f"❌ خطأ في التنبؤ: {e}")
# Score: 2000

# MaxTile: 64

# MoveTime(ms): 200

# EmptyTiles: 3